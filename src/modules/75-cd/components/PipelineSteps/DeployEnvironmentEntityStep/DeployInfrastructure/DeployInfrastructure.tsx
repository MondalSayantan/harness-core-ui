/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { defaultTo, get, isEmpty, isNil, set } from 'lodash-es'
import { useFormikContext } from 'formik'
import produce from 'immer'
import { v4 as uuid } from 'uuid'

import {
  AllowedTypes,
  getMultiTypeFromValue,
  MultiTypeInputType,
  RUNTIME_INPUT_VALUE,
  Text,
  useToaster
} from '@harness/uicore'

import { Color } from '@harness/design-system'

import { StageElementWrapperConfig } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'

import { useDeepCompareEffect } from '@common/hooks'
import { SELECT_ALL_OPTION } from '@common/components/MultiTypeMultiSelectDropDown/MultiTypeMultiSelectDropDownUtils'
import { isValueRuntimeInput } from '@common/utils/utils'

import { ButtonProps } from '@rbac/components/Button/Button'

import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'

import { usePipelineVariables } from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'
import { PropagateSelectOption } from '@pipeline/components/PipelineInputSetForm/EnvironmentsInputSetForm/utils'
import { getScopeFromValue } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import InfrastructureEntitiesList from '../InfrastructureEntitiesList/InfrastructureEntitiesList'
import type {
  DeployEnvironmentEntityCustomStepProps,
  DeployEnvironmentEntityFormState,
  InfrastructureWithInputs
} from '../types'
import { useGetInfrastructuresData } from './useGetInfrastructuresData'

import InfrastructureSelection from './InfrastructureSelection'

interface DeployInfrastructureProps
  extends Required<
    Omit<DeployEnvironmentEntityCustomStepProps, 'gitOpsEnabled' | 'stageIdentifier' | 'serviceIdentifiers'>
  > {
  initialValues: DeployEnvironmentEntityFormState
  readonly: boolean
  allowableTypes: AllowedTypes
  environmentIdentifier: string
  isMultiInfrastructure?: boolean
  lazyInfrastructure?: boolean
  environmentPermission?: ButtonProps['permission']
  previousStages?: StageElementWrapperConfig[]
  selectedPropagatedState?: PropagateSelectOption | string
}

function getSelectedInfrastructuresWhenPropagating(
  value?: string,
  previousStages?: StageElementWrapperConfig[]
): string[] {
  const infrastructureDefinitions = (
    previousStages?.find(previousStage => previousStage.stage?.identifier === value)
      ?.stage as DeploymentStageElementConfig
  )?.spec?.environment?.infrastructureDefinitions

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isValueRuntimeInput(infrastructureDefinitions as any)) return []

  const prevInfraId = infrastructureDefinitions?.[0].identifier
  return prevInfraId ? [prevInfraId] : []
}

export function getAllFixedInfrastructures(
  data: DeployEnvironmentEntityFormState,
  environmentIdentifier: string,
  previousStages?: StageElementWrapperConfig[]
): string[] {
  if (data.propagateFrom?.value) {
    return getSelectedInfrastructuresWhenPropagating(data.propagateFrom?.value as string, previousStages)
  } else if (data.infrastructure && getMultiTypeFromValue(data.infrastructure) === MultiTypeInputType.FIXED) {
    return [data.infrastructure as string]
  } else if (
    data.infrastructures?.[environmentIdentifier] &&
    Array.isArray(data.infrastructures[environmentIdentifier])
  ) {
    return data.infrastructures[environmentIdentifier].map(infrastructure => infrastructure.value as string)
  }

  return []
}

export default function DeployInfrastructure({
  initialValues,
  readonly,
  allowableTypes,
  environmentIdentifier,
  isMultiInfrastructure,
  deploymentType,
  customDeploymentRef,
  lazyInfrastructure,
  environmentPermission,
  previousStages,
  selectedPropagatedState
}: DeployInfrastructureProps): JSX.Element {
  const { values, setFieldValue, setValues, setFieldTouched, validateForm } =
    useFormikContext<DeployEnvironmentEntityFormState>()
  const { getString } = useStrings()
  const { showWarning } = useToaster()
  const { refetchPipelineVariable } = usePipelineVariables()
  const { templateRef: deploymentTemplateIdentifier, versionLabel } = customDeploymentRef || {}
  const uniquePathForInfrastructures = React.useRef(`_pseudo_field_${uuid()}`)
  let envToFetchInfraInputs = environmentIdentifier

  // State
  const [selectedInfrastructures, setSelectedInfrastructures] = useState(
    getAllFixedInfrastructures(initialValues, environmentIdentifier, previousStages)
  )
  const [infrastructureRefType, setInfrastructureRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue(initialValues.infrastructure)
  )

  if (get(values, 'category') === 'group') {
    const scope = getScopeFromValue(get(values, 'environmentGroup') as string)
    envToFetchInfraInputs = scope !== Scope.PROJECT ? `${scope}.${environmentIdentifier}` : environmentIdentifier
  }

  // Constants
  const isFixed =
    (isMultiInfrastructure
      ? getMultiTypeFromValue(values.infrastructures?.[environmentIdentifier])
      : infrastructureRefType) === MultiTypeInputType.FIXED

  const shouldAddCustomDeploymentData =
    deploymentType === ServiceDeploymentType.CustomDeployment && deploymentTemplateIdentifier

  // API
  const {
    infrastructuresList,
    infrastructuresData,
    loadingInfrastructuresList,
    loadingInfrastructuresData,
    // This is required only when updating the entities list
    updatingInfrastructuresData,
    refetchInfrastructuresList,
    refetchInfrastructuresData,
    prependInfrastructureToInfrastructureList,
    nonExistingInfrastructureIdentifiers
  } = useGetInfrastructuresData({
    environmentIdentifier: envToFetchInfraInputs,
    // this condition makes the yaml metadata call data
    infrastructureIdentifiers: lazyInfrastructure ? [] : selectedInfrastructures,
    deploymentType,
    ...(shouldAddCustomDeploymentData && {
      deploymentTemplateIdentifier,
      versionLabel
    }),
    lazyInfrastructure
  })

  useEffect(() => {
    if (!values.infrastructure && isEmpty(values.infrastructures)) {
      setSelectedInfrastructures(
        getSelectedInfrastructuresWhenPropagating(values.propagateFrom?.value as string, previousStages)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.propagateFrom?.value])

  useDeepCompareEffect(() => {
    if (nonExistingInfrastructureIdentifiers.length) {
      showWarning(
        getString('cd.identifiersDoNotExist', {
          entity: getString('infrastructureText'),
          nonExistingIdentifiers: nonExistingInfrastructureIdentifiers.join(', ')
        })
      )
    }
  }, [nonExistingInfrastructureIdentifiers])

  const loading = loadingInfrastructuresList || loadingInfrastructuresData

  useEffect(() => {
    if (!loading) {
      // update infrastructures in formik
      /* istanbul ignore else */
      if (values && infrastructuresData.length > 0) {
        if (values.infrastructure && !values.infrastructureInputs?.[environmentIdentifier]?.[values.infrastructure]) {
          const infrastructure = infrastructuresData.find(
            infrastructureData => infrastructureData.infrastructureDefinition.identifier === values.infrastructure
          )

          setValues({
            ...values,
            // if infrastructure input is not found, add it, else use the existing one
            infrastructureInputs: {
              [environmentIdentifier]: {
                [values.infrastructure]: get(
                  values.infrastructureInputs,
                  `['${environmentIdentifier}'].${values.infrastructure}`,
                  infrastructure?.infrastructureInputs
                )
              }
            }
          })
        } else if (values.infrastructures && Array.isArray(values.infrastructures?.[environmentIdentifier])) {
          const updatedInfrastructures = values.infrastructures[environmentIdentifier].reduce<InfrastructureWithInputs>(
            (p, c) => {
              const infrastructure = infrastructuresData.find(
                infrastructureData => infrastructureData.infrastructureDefinition.identifier === c.value
              )

              if (!Array.isArray(p.infrastructures[environmentIdentifier])) {
                p.infrastructures[environmentIdentifier] = []
              }

              if (infrastructure) {
                p.infrastructures[environmentIdentifier].push({
                  label: infrastructure.infrastructureDefinition.name,
                  value: infrastructure.infrastructureDefinition.identifier
                })
                // if infrastructure input is not found, add it, else use the existing one
                const infrastructureInputs = get(
                  values.infrastructureInputs,
                  [environmentIdentifier, infrastructure.infrastructureDefinition.identifier],
                  infrastructure?.infrastructureInputs
                )

                set(
                  p.infrastructureInputs,
                  `['${environmentIdentifier}'].${infrastructure.infrastructureDefinition.identifier}`,
                  infrastructureInputs
                )
              } else {
                p.infrastructures[environmentIdentifier].push(c)
              }

              return p
            },
            {
              infrastructures: {},
              infrastructureInputs: {}
            }
          )
          setValues({
            ...values,
            // set value of unique path created to handle infrastructures if some infrastructures are already selected, else select All
            [uniquePathForInfrastructures.current]: selectedInfrastructures.map(infraId => ({
              label: defaultTo(
                infrastructuresList.find(infrastructureInList => infrastructureInList.identifier === infraId)?.name,
                infraId
              ),
              value: infraId
            })),
            infrastructures: { ...values.infrastructures, ...updatedInfrastructures.infrastructures },
            infrastructureInputs: { ...values.infrastructureInputs, ...updatedInfrastructures.infrastructureInputs }
          })
        }
      } else if (isMultiInfrastructure && isEmpty(selectedInfrastructures)) {
        // set value of unique path to All in case no infrastructures are selected or runtime if infrastructures is set to runtime
        // This is specifically used for on load
        const infraIdentifierValue =
          getMultiTypeFromValue(values.infrastructures?.[environmentIdentifier]) === MultiTypeInputType.RUNTIME
            ? values.infrastructures?.[environmentIdentifier]
            : [SELECT_ALL_OPTION]

        // This if condition is used to show runtime value for the infrastructure when it is shown for filtering
        if (readonly && isValueRuntimeInput(initialValues.environments)) {
          setFieldValue(`${uniquePathForInfrastructures.current}`, RUNTIME_INPUT_VALUE)
        } else {
          setFieldValue(`${uniquePathForInfrastructures.current}`, infraIdentifierValue)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, infrastructuresList, infrastructuresData])

  const updateFormikAndLocalState = (newFormValues: DeployEnvironmentEntityFormState): void => {
    const fieldName = isMultiInfrastructure ? `infrastructures.${environmentIdentifier}` : 'infrastructure'
    // this sets the form values
    setValues(newFormValues)
    setFieldTouched(fieldName, true)
    validateForm(newFormValues)

    // this updates the local state
    setSelectedInfrastructures(getAllFixedInfrastructures(newFormValues, environmentIdentifier))
  }

  const onInfrastructureEntityUpdate = (): void => {
    refetchPipelineVariable?.()
    refetchInfrastructuresList()
    refetchInfrastructuresData()
  }

  const onRemoveInfrastructureFromList = (infrastructureToDelete: string): void => {
    const newFormValues = produce(values, draft => {
      if (draft.infrastructure) {
        draft.infrastructure = ''
        delete draft.infrastructures
      } else if (draft.infrastructures && Array.isArray(draft.infrastructures[environmentIdentifier])) {
        const filteredInfrastructures = draft.infrastructures[environmentIdentifier].filter(
          infra => infra.value !== infrastructureToDelete
        )
        draft.infrastructures[environmentIdentifier] = filteredInfrastructures
        set(draft, uniquePathForInfrastructures.current, filteredInfrastructures)
      }
    })

    updateFormikAndLocalState(newFormValues)
  }

  return (
    <>
      {isNil(values.propagateFrom) ? (
        <InfrastructureSelection
          environmentIdentifier={environmentIdentifier}
          isMultiInfrastructure={isMultiInfrastructure}
          uniquePathForInfrastructures={uniquePathForInfrastructures}
          readonly={readonly}
          loading={loading}
          infrastructureRefType={infrastructureRefType}
          setInfrastructureRefType={setInfrastructureRefType}
          setSelectedInfrastructures={setSelectedInfrastructures}
          allowableTypes={allowableTypes}
          infrastructuresList={infrastructuresList}
          prependInfrastructureToInfrastructureList={prependInfrastructureToInfrastructureList}
          updateFormikAndLocalState={updateFormikAndLocalState}
          deploymentType={deploymentType}
          customDeploymentRef={customDeploymentRef}
          lazyInfrastructure={lazyInfrastructure}
          environmentPermission={environmentPermission}
          isSingleEnv={!!(values?.category === 'single' && values?.environment)}
        />
      ) : (
        <Text color={Color.BLACK}>
          {getString('pipeline.infrastructurePropagatedFrom')}{' '}
          {(selectedPropagatedState as PropagateSelectOption)?.infraLabel}
        </Text>
      )}

      {isFixed && !isEmpty(selectedInfrastructures) && (
        <InfrastructureEntitiesList
          loading={loading || updatingInfrastructuresData}
          infrastructuresData={infrastructuresData}
          readonly={readonly}
          allowableTypes={allowableTypes}
          onInfrastructureEntityUpdate={onInfrastructureEntityUpdate}
          onRemoveInfrastructureFromList={onRemoveInfrastructureFromList}
          environmentIdentifier={environmentIdentifier}
          customDeploymentRef={customDeploymentRef}
          environmentPermission={environmentPermission}
        />
      )}
    </>
  )
}
