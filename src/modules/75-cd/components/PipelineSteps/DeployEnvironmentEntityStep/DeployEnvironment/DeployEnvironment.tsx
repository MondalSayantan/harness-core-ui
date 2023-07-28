/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { MutableRefObject, useEffect, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { defaultTo, get, isEmpty, isNil, set } from 'lodash-es'
import { useFormikContext } from 'formik'
import produce from 'immer'
import { Divider } from '@blueprintjs/core'
import { v4 as uuid } from 'uuid'

import {
  AllowedTypes,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  RUNTIME_INPUT_VALUE,
  SelectOption,
  useToaster
} from '@harness/uicore'
import type { NGEnvironmentInfoConfig } from 'services/cd-ng'
import { StageElementWrapperConfig } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'

import { SELECT_ALL_OPTION } from '@common/components/MultiTypeMultiSelectDropDown/MultiTypeMultiSelectDropDownUtils'
import {
  isMultiTypeExpression,
  isMultiTypeFixed,
  isMultiTypeRuntime,
  isValueExpression,
  isValueFixed,
  isValueRuntimeInput
} from '@common/utils/utils'
import { useDeepCompareEffect } from '@common/hooks'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { getScopedValueFromDTO } from '@common/components/EntityReference/EntityReference.types'

import { getAllowableTypesWithoutExpression } from '@pipeline/utils/runPipelineUtils'
import { isDynamicProvisioningRestricted } from '@pipeline/utils/stageHelpers'
import { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'

import { usePipelineVariables } from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'

import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import EnvironmentEntitiesList from '../EnvironmentEntitiesList/EnvironmentEntitiesList'
import type {
  DeployEnvironmentEntityCustomStepProps,
  DeployEnvironmentEntityFormState,
  EnvironmentWithInputs
} from '../types'
import { useGetEnvironmentsData } from './useGetEnvironmentsData'
import DeployInfrastructure from '../DeployInfrastructure/DeployInfrastructure'
import DeployCluster from '../DeployCluster/DeployCluster'

import {
  InlineEntityFiltersProps,
  InlineEntityFiltersRadioType
} from '../components/InlineEntityFilters/InlineEntityFiltersUtils'
import { DeployProvisioner } from '../DeployProvisioner/DeployProvisioner'
import EnvironmentSelection from './EnvironmentSelection'
import css from './DeployEnvironment.module.scss'

interface DeployEnvironmentProps extends Required<DeployEnvironmentEntityCustomStepProps> {
  initialValues: DeployEnvironmentEntityFormState
  readonly: boolean
  allowableTypes: AllowedTypes
  isMultiEnvironment: boolean
  /** env group specific props */
  isUnderEnvGroup?: boolean
  envGroupIdentifier?: string
  environmentsTypeRef?: MutableRefObject<MultiTypeInputType | null>
  canPropagateFromStage?: boolean
  previousStages?: StageElementWrapperConfig[]
  selectedPropagatedState?: SelectOption | string
}

function getSelectedEnvironmentsWhenPropagating(
  value?: string,
  previousStages?: StageElementWrapperConfig[]
): string[] {
  const prevEnvId = (
    previousStages?.find(previousStage => previousStage.stage?.identifier === value)
      ?.stage as DeploymentStageElementConfig
  )?.spec?.environment?.environmentRef
  return prevEnvId && isValueFixed(prevEnvId) ? [prevEnvId] : []
}

export function getAllFixedEnvironments(
  data: DeployEnvironmentEntityFormState,
  previousStages?: StageElementWrapperConfig[]
): string[] {
  if (data.propagateFrom?.value) {
    return getSelectedEnvironmentsWhenPropagating(data.propagateFrom?.value as string, previousStages)
  } else if (data.environment && getMultiTypeFromValue(data.environment) === MultiTypeInputType.FIXED) {
    return [data.environment as string]
  } else if (data.environments && Array.isArray(data.environments)) {
    return data.environments.map(environment => environment.value as string)
  }

  return []
}

export default function DeployEnvironment({
  initialValues,
  readonly,
  allowableTypes,
  isMultiEnvironment,
  serviceIdentifiers,
  envGroupIdentifier,
  isUnderEnvGroup,
  stageIdentifier,
  deploymentType,
  customDeploymentRef,
  gitOpsEnabled,
  environmentsTypeRef,
  canPropagateFromStage,
  previousStages,
  selectedPropagatedState
}: DeployEnvironmentProps): JSX.Element {
  const { values, setFieldValue, setValues, errors, setFieldError, setFieldTouched } =
    useFormikContext<DeployEnvironmentEntityFormState>()
  const { getString } = useStrings()
  const { showWarning } = useToaster()
  const { refetchPipelineVariable } = usePipelineVariables()
  const uniquePathForEnvironments = React.useRef(`_pseudo_field_${uuid()}`)

  const { CD_NG_DYNAMIC_PROVISIONING_ENV_V2, CDS_SERVICE_OVERRIDES_2_0: isOverridesEnabled } = useFeatureFlags()

  // State
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(
    getAllFixedEnvironments(initialValues, previousStages)
  )
  const [environmentsType, setEnvironmentsType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue(initialValues.environment || initialValues.environments)
  )
  // Constants
  const isFixed = isMultiTypeFixed(environmentsType)
  const isRuntime = isMultiTypeRuntime(environmentsType)
  const isExpression = isMultiTypeExpression(environmentsType)
  const filterPrefix = 'environmentFilters.runtime'

  const shouldRenderEnvironmentEntitiesList = (isFixed || values.propagateFrom) && !isEmpty(selectedEnvironments)

  // API
  const {
    environmentsList,
    environmentsData,
    loadingEnvironmentsList,
    loadingEnvironmentsData,
    // This is required only when updating the entities list
    updatingEnvironmentsData,
    refetchEnvironmentsList,
    refetchEnvironmentsData,
    prependEnvironmentToEnvironmentList,
    nonExistingEnvironmentIdentifiers
  } = useGetEnvironmentsData({
    envIdentifiers: selectedEnvironments,
    envGroupIdentifier,
    serviceIdentifiers
  })

  useEffect(() => {
    // do this only on mount of mulit env component
    if (isMultiTypeExpression(environmentsTypeRef?.current as MultiTypeInputType) && isMultiEnvironment) {
      setEnvironmentsType(MultiTypeInputType.FIXED)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!values.environment) {
      setSelectedEnvironments(
        getSelectedEnvironmentsWhenPropagating(values.propagateFrom?.value as string, previousStages)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.propagateFrom?.value])

  useDeepCompareEffect(() => {
    if (nonExistingEnvironmentIdentifiers.length) {
      showWarning(
        getString('cd.identifiersDoNotExist', {
          entity: getString('environment'),
          nonExistingIdentifiers: nonExistingEnvironmentIdentifiers.join(', ')
        })
      )
    }
  }, [nonExistingEnvironmentIdentifiers])

  useEffect(() => {
    if (environmentsTypeRef?.current === null || environmentsTypeRef?.current) {
      environmentsTypeRef.current = environmentsType
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentsType])

  useEffect(() => {
    /**
     * This sets the type of the field when toggling between single, multi environment & environment group
     * This is required as the initialValues get updated 1 tick later and hence type would be fixed by default
     */
    if (
      (isValueRuntimeInput(values.environment) || isValueRuntimeInput(values.environments)) &&
      !isMultiTypeRuntime(environmentsType)
    ) {
      setEnvironmentsType(MultiTypeInputType.RUNTIME)
    }
  }, [values.environment, values.environments, environmentsType])

  const loading = isFixed && (loadingEnvironmentsList || loadingEnvironmentsData)

  const shouldRenderChildEntity = isExpression
    ? isValueExpression(values.environment)
    : nonExistingEnvironmentIdentifiers.length
    ? false
    : shouldRenderEnvironmentEntitiesList

  useEffect(() => {
    // This condition is required to clear the list when switching from multi environment to single environment
    if (!isMultiEnvironment && !values.environment && isNil(values.propagateFrom) && selectedEnvironments.length) {
      setSelectedEnvironments([])
    }

    // This condition sets the unique path when switching from single env to multi env after the component has loaded with single env view
    if (
      isMultiEnvironment &&
      ((values.environments?.length && selectedEnvironments.length) || (!isFixed && values.environments))
    ) {
      setFieldValue(uniquePathForEnvironments.current, values.environments)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiEnvironment])

  useEffect(() => {
    if (errors.environments) {
      setFieldError(uniquePathForEnvironments.current, errors.environments)
    } else {
      setFieldError(uniquePathForEnvironments.current, undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors])

  useEffect(() => {
    if (!loading) {
      // update environments in formik
      /* istanbul ignore else */
      if (values && environmentsData.length > 0) {
        if (values.environment && !values.environmentInputs?.[values.environment]) {
          const environment = environmentsData.find(
            environmentData => getScopedValueFromDTO(environmentData.environment) === values.environment
          )

          const environmentServiceOverrideInputs: Record<string, any> = {}
          const existingServiceOverrideInputs = values.serviceOverrideInputs?.[values.environment]

          serviceIdentifiers?.forEach(serviceIdentifier => {
            const serviceOverrideValueForService = get(
              existingServiceOverrideInputs,
              serviceIdentifier,
              environment?.serviceOverrideInputs[values.environment as string]?.[serviceIdentifier]
            )

            if (!isNil(serviceOverrideValueForService)) {
              environmentServiceOverrideInputs[serviceIdentifier] = serviceOverrideValueForService
            }
          })

          setValues({
            ...values,
            // if environment input is not found, add it, else use the existing one
            environmentInputs: {
              [values.environment]: get(values.environmentInputs, [values.environment], environment?.environmentInputs)
            },
            serviceOverrideInputs: {
              [values.environment]: environmentServiceOverrideInputs
            }
          })
        } else if (Array.isArray(values.environments)) {
          const updatedEnvironments = values.environments.reduce<EnvironmentWithInputs>(
            (p, c) => {
              const environment = environmentsData.find(environmentData => {
                if (envGroupIdentifier) {
                  return environmentData.environment.identifier === c.value
                }
                return getScopedValueFromDTO(environmentData.environment) === c.value
              })
              if (environment) {
                p.environments.push({ label: environment.environment.name, value: c.value })
                // if environment input is not found, add it, else use the existing one
                const environmentInputs = get(values.environmentInputs, [c.value], environment?.environmentInputs)

                const environmentServiceOverrideInputs: Record<string, any> = {}
                const existingServiceOverrideInputs = values.serviceOverrideInputs?.[c.value as string]

                serviceIdentifiers?.forEach(serviceIdentifier => {
                  const serviceOverrideValueForService = get(
                    existingServiceOverrideInputs,
                    serviceIdentifier,
                    environment?.serviceOverrideInputs[c.value as string]?.[serviceIdentifier]
                  )

                  if (!isNil(serviceOverrideValueForService)) {
                    environmentServiceOverrideInputs[serviceIdentifier] = serviceOverrideValueForService
                  }
                })

                p.environmentInputs[c.value as string] = environmentInputs
                p.serviceOverrideInputs[c.value as string] = environmentServiceOverrideInputs
              } else {
                p.environments.push(c)
              }

              return p
            },
            { environments: [], environmentInputs: {}, serviceOverrideInputs: {}, parallel: values.parallel }
          )

          setValues({
            ...values,
            ...updatedEnvironments,
            // set value of unique path created to handle environments if some environments are already selected, else select All
            [uniquePathForEnvironments.current]: selectedEnvironments.map(envId => ({
              label: defaultTo(
                environmentsList.find(
                  environmentInList => getScopedValueFromDTO(environmentInList as NGEnvironmentInfoConfig) === envId
                )?.name,
                envId
              ),
              value: envId
            }))
          })
        }
      } else if (isMultiEnvironment && isEmpty(selectedEnvironments)) {
        // set value of unique path to All in case no environments are selected or runtime if environments is set to runtime
        // This is specifically used for on load
        const envIdentifierValue =
          getMultiTypeFromValue(initialValues.environments) === MultiTypeInputType.RUNTIME
            ? initialValues.environments
            : [SELECT_ALL_OPTION]

        setFieldValue(`${uniquePathForEnvironments.current}`, envIdentifierValue)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, environmentsList, environmentsData])

  const updateFormikAndLocalState = (newFormValues: DeployEnvironmentEntityFormState): void => {
    // this sets the form values
    setValues(newFormValues)
    // this updates the local state
    setSelectedEnvironments(getAllFixedEnvironments(newFormValues))
  }

  const onEnvironmentEntityUpdate = (): void => {
    refetchPipelineVariable?.()
    refetchEnvironmentsList()
    refetchEnvironmentsData()
  }

  const onRemoveEnvironmentFromList = (environmentToDelete: string): void => {
    const newFormValues = produce(values, draft => {
      if (draft.environment) {
        draft.environment = ''

        if (gitOpsEnabled) {
          draft.cluster = ''
        } else {
          draft.infrastructure = ''
        }

        delete draft.environments
      } else if (Array.isArray(draft.environments)) {
        const filteredEnvironments = draft.environments.filter(env => env.value !== environmentToDelete)
        draft.environments = filteredEnvironments
        set(draft, uniquePathForEnvironments.current, filteredEnvironments)
        setFieldTouched(uniquePathForEnvironments.current, true)

        if (
          gitOpsEnabled &&
          draft.clusters?.[environmentToDelete] &&
          Array.isArray(draft.clusters[environmentToDelete])
        ) {
          delete draft.clusters[environmentToDelete]
        } else if (
          !gitOpsEnabled &&
          draft.infrastructures?.[environmentToDelete] &&
          Array.isArray(draft.infrastructures[environmentToDelete])
        ) {
          delete draft.infrastructures[environmentToDelete]
        }
      }
    })

    updateFormikAndLocalState(newFormValues)
  }

  const handleFilterRadio = (selectedRadioValue: InlineEntityFiltersRadioType): void => {
    if (selectedRadioValue === InlineEntityFiltersRadioType.MANUAL) {
      unstable_batchedUpdates(() => {
        setFieldValue(gitOpsEnabled ? 'clusters' : 'infrastructures', RUNTIME_INPUT_VALUE)
        setFieldValue(filterPrefix, undefined)
      })
    }
  }

  const shouldShowDynamicProvisioning =
    !(isFixed && isEmpty(selectedEnvironments)) &&
    isNil(values.propagateFrom) &&
    !isMultiEnvironment &&
    CD_NG_DYNAMIC_PROVISIONING_ENV_V2 &&
    !isDynamicProvisioningRestricted(deploymentType)

  return (
    <>
      {isNil(values.propagateFrom) && (
        <EnvironmentSelection
          isMultiEnvironment={isMultiEnvironment}
          isUnderEnvGroup={isUnderEnvGroup}
          uniquePathForEnvironments={uniquePathForEnvironments}
          readonly={readonly}
          loading={loading}
          environmentsType={environmentsType}
          setEnvironmentsType={setEnvironmentsType}
          setSelectedEnvironments={setSelectedEnvironments}
          allowableTypes={allowableTypes}
          gitOpsEnabled={gitOpsEnabled}
          environmentsList={environmentsList}
          prependEnvironmentToEnvironmentList={prependEnvironmentToEnvironmentList}
          updateFormikAndLocalState={updateFormikAndLocalState}
          canPropagateFromStage={canPropagateFromStage}
        />
      )}

      <Layout.Vertical className={canPropagateFromStage ? '' : css.mainContent} spacing="medium">
        {isMultiEnvironment && !isUnderEnvGroup ? (
          <FormInput.CheckBox
            label={
              gitOpsEnabled
                ? getString('cd.pipelineSteps.environmentTab.multiEnvironmentsParallelDeployClusterLabel')
                : getString('cd.pipelineSteps.environmentTab.multiEnvironmentsParallelDeployLabel')
            }
            name="parallel"
          />
        ) : null}
        {shouldRenderEnvironmentEntitiesList && (
          <EnvironmentEntitiesList
            loading={loading || updatingEnvironmentsData}
            environmentsData={environmentsData}
            readonly={readonly}
            allowableTypes={allowableTypes}
            onEnvironmentEntityUpdate={onEnvironmentEntityUpdate}
            onRemoveEnvironmentFromList={onRemoveEnvironmentFromList}
            serviceIdentifiers={serviceIdentifiers.length === 1 || isOverridesEnabled ? serviceIdentifiers : []}
            initialValues={initialValues}
            stageIdentifier={stageIdentifier}
            deploymentType={deploymentType}
            customDeploymentRef={customDeploymentRef}
            gitOpsEnabled={gitOpsEnabled}
          />
        )}
        {shouldShowDynamicProvisioning && (
          <DeployProvisioner initialValues={initialValues} allowableTypes={allowableTypes} />
        )}
        {shouldRenderChildEntity && !loading && !isMultiEnvironment && (
          <>
            <Divider />
            {gitOpsEnabled ? (
              <DeployCluster
                initialValues={initialValues}
                readonly={readonly}
                allowableTypes={getAllowableTypesWithoutExpression(allowableTypes)}
                isMultiCluster
                environmentIdentifier={selectedEnvironments[0]}
              />
            ) : (
              <DeployInfrastructure
                initialValues={initialValues}
                readonly={readonly}
                allowableTypes={allowableTypes}
                environmentIdentifier={selectedEnvironments[0]}
                deploymentType={deploymentType}
                customDeploymentRef={customDeploymentRef}
                lazyInfrastructure={isExpression}
                previousStages={previousStages}
                selectedPropagatedState={selectedPropagatedState}
              />
            )}
          </>
        )}

        {/* This component is specifically for filters */}
        {isRuntime && !readonly && (isMultiEnvironment ? true : gitOpsEnabled) && (
          <StepWidget<InlineEntityFiltersProps>
            type={StepType.InlineEntityFilters}
            factory={factory}
            stepViewType={StepViewType.Edit}
            readonly={readonly}
            allowableTypes={allowableTypes}
            initialValues={{
              filterPrefix,
              entityStringKey: gitOpsEnabled ? 'common.clusters' : 'common.infrastructures',
              onRadioValueChange: handleFilterRadio,
              showCard: true,
              hasTopMargin: true,
              baseComponent: (
                <>
                  {gitOpsEnabled ? (
                    <DeployCluster
                      initialValues={{
                        environments: RUNTIME_INPUT_VALUE as any
                      }}
                      readonly
                      allowableTypes={allowableTypes}
                      isMultiCluster
                      environmentIdentifier={''}
                      lazyCluster
                    />
                  ) : (
                    <DeployInfrastructure
                      initialValues={{
                        environments: RUNTIME_INPUT_VALUE as any
                      }}
                      readonly
                      allowableTypes={allowableTypes}
                      environmentIdentifier={''}
                      isMultiInfrastructure
                      deploymentType={deploymentType}
                      customDeploymentRef={customDeploymentRef}
                      lazyInfrastructure
                    />
                  )}
                </>
              ),
              entityFilterProps: {
                entities: [gitOpsEnabled ? 'gitOpsClusters' : 'infrastructures']
              }
            }}
          />
        )}
      </Layout.Vertical>
    </>
  )
}
