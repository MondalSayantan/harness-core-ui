/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, FontVariation } from '@harness/design-system'
import {
  Accordion,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  Icon,
  Layout,
  MultiTypeInputType,
  SelectOption,
  Text
} from '@harness/uicore'
import cx from 'classnames'
import type { FormikProps } from 'formik'
import { get } from 'lodash-es'
import React from 'react'
import { useParams } from 'react-router-dom'
import { ALLOWED_VALUES_TYPE, ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { ConnectorConfigureOptions } from '@connectors/components/ConnectorConfigureOptions/ConnectorConfigureOptions'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { Connectors } from '@connectors/constants'
import { getIconByType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { setFormikRef, StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import {
  getFormValuesInCorrectFormat,
  getInitialValuesInCorrectFormat
} from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import { validate } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useGitScope } from '@pipeline/utils/CIUtils'
import type { BuildStageElementConfig } from '@pipeline/utils/pipelineTypes'
import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'
import { useStrings } from 'framework/strings'
import type {} from 'services/ci'
import { SbomOrchestrationTool, SbomSource, SyftSbomOrchestration } from 'services/pipeline-ng'
import { editViewValidateFieldsConfig, transformValuesFieldsConfig } from './SscaOrchestrationStepFunctionConfigs'
import { SscaStepProps } from './types'
import { AllMultiTypeInputTypesForStep } from './utils'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './SscaStep.module.scss'

const getTypedOptions = <T extends string>(input: T[]): SelectOption[] => {
  return input.map(item => ({ label: item, value: item }))
}

const artifactTypeOptions = getTypedOptions<SbomSource['type']>(['image'])
const sbomGenerationToolOptions = getTypedOptions<SbomOrchestrationTool['type']>(['Syft'])
const syftSbomFormats: { label: string; value: SyftSbomOrchestration['format'] }[] = [
  { label: 'SPDX', value: 'spdx-json' },
  { label: 'CycloneDX', value: 'cyclonedx-json' }
]

const SscaOrchestrationStepEdit = <T,>(
  {
    initialValues,
    onUpdate,
    isNewStep = true,
    readonly,
    stepViewType,
    onChange,
    allowableTypes,
    stepType
  }: SscaStepProps<T>,
  formikRef: StepFormikFowardRef<T>
): JSX.Element => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  const { getStageFromPipeline, state } = usePipelineContext()
  const { stage: currentStage } = getStageFromPipeline<BuildStageElementConfig>(
    state.selectionState.selectedStageId || ''
  )
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const gitScope = useGitScope()

  return (
    <Formik
      initialValues={getInitialValuesInCorrectFormat<T, T>(initialValues, transformValuesFieldsConfig(stepType))}
      formName={stepType}
      validate={valuesToValidate => {
        const schemaValues = getFormValuesInCorrectFormat<T, T>(valuesToValidate, transformValuesFieldsConfig(stepType))
        onChange?.(schemaValues)
        return validate(
          valuesToValidate,
          editViewValidateFieldsConfig(stepType),
          {
            initialValues,
            steps: currentStage?.stage?.spec?.execution?.steps || {},
            serviceDependencies: currentStage?.stage?.spec?.serviceDependencies || {},
            getString
          },
          stepViewType
        )
      }}
      onSubmit={(_values: T) => {
        const schemaValues = getFormValuesInCorrectFormat<T, T>(_values, transformValuesFieldsConfig(stepType))
        onUpdate?.(schemaValues)
      }}
    >
      {(formik: FormikProps<T>) => {
        // This is required
        setFormikRef?.(formikRef, formik)

        return (
          <FormikForm>
            <div className={css.stepContainer}>
              {stepViewType !== StepViewType.Template && (
                <FormInput.InputWithIdentifier
                  inputName="name"
                  idName="identifier"
                  inputLabel={getString('pipelineSteps.stepNameLabel')}
                  isIdentifierEditable={isNewStep}
                  inputGroupProps={{ disabled: readonly }}
                />
              )}

              <Text font={{ variation: FontVariation.FORM_SUB_SECTION }} color={Color.GREY_900}>
                {getString('ssca.orchestrationStep.sbomGeneration')}
              </Text>

              <FormInput.Select
                items={sbomGenerationToolOptions}
                name="spec.tool.type"
                label={getString('ssca.orchestrationStep.sbomTool')}
                placeholder={getString('select')}
                disabled={readonly}
              />

              <FormInput.RadioGroup
                items={syftSbomFormats}
                name="spec.tool.spec.format"
                label={getString('ssca.orchestrationStep.sbomFormat')}
                disabled={readonly}
                radioGroup={{ inline: true }}
              />

              <Text
                font={{ variation: FontVariation.FORM_SUB_SECTION }}
                color={Color.GREY_900}
                margin={{ top: 'medium' }}
              >
                {getString('ssca.orchestrationStep.artifactSource')}
              </Text>

              <FormInput.Select
                items={artifactTypeOptions}
                name="spec.source.type"
                label={getString('pipeline.artifactsSelection.artifactType')}
                placeholder={getString('select')}
                disabled={readonly}
              />

              <FormMultiTypeConnectorField
                label={getString('pipelineSteps.connectorLabel')}
                type={[Connectors.GCP, Connectors.AWS, Connectors.DOCKER, Connectors.AZURE]}
                name="spec.source.spec.connector"
                placeholder={getString('select')}
                accountIdentifier={accountId}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                multiTypeProps={{
                  expressions,
                  allowableTypes: AllMultiTypeInputTypesForStep,
                  disabled: readonly
                }}
                gitScope={gitScope}
                setRefValue
                configureOptionsProps={{
                  hideExecutionTimeField: true
                }}
              />

              <MultiTypeTextField
                name="spec.source.spec.image"
                label={
                  <Text className={css.formLabel} tooltipProps={{ dataTooltipId: 'image' }}>
                    {getString('imageLabel')}
                  </Text>
                }
                multiTextInputProps={{
                  disabled: readonly,
                  multiTextInputProps: {
                    allowableTypes: AllMultiTypeInputTypesForStep
                  }
                }}
                configureOptionsProps={{
                  hideExecutionTimeField: true
                }}
              />

              <Text
                font={{ variation: FontVariation.FORM_SUB_SECTION }}
                color={Color.GREY_900}
                margin={{ top: 'medium' }}
              >
                {getString('ssca.orchestrationStep.sbomAttestation')}
              </Text>

              <MultiTypeSecretInput
                type="SecretFile"
                name="spec.attestation.spec.privateKey"
                label={getString('connectors.serviceNow.privateKey')}
                expressions={expressions}
                disabled={readonly}
              />

              <MultiTypeSecretInput
                name="spec.attestation.spec.password"
                label={getString('password')}
                expressions={expressions}
                disabled={readonly}
              />

              {stepType === StepType.CdSscaOrchestration && (
                <>
                  <Text
                    font={{ variation: FontVariation.FORM_SUB_SECTION }}
                    color={Color.GREY_900}
                    margin={{ top: 'medium' }}
                  >
                    {getString('infrastructureText')}
                  </Text>

                  <div className={cx(stepCss.formGroup, stepCss.lg)}>
                    <FormMultiTypeConnectorField
                      name="spec.infrastructure.spec.connectorRef"
                      label={getString('connector')}
                      placeholder={getString('common.entityPlaceholderText')}
                      disabled={readonly}
                      accountIdentifier={accountId}
                      multiTypeProps={{ expressions, disabled: readonly, allowableTypes }}
                      projectIdentifier={projectIdentifier}
                      orgIdentifier={orgIdentifier}
                      enableConfigureOptions={false}
                      setRefValue
                      gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                    />
                    {getMultiTypeFromValue(get(formik.values, 'spec.infrastructure.spec.connectorRef')) ===
                      MultiTypeInputType.RUNTIME &&
                      !readonly && (
                        <ConnectorConfigureOptions
                          style={{ marginTop: 10 }}
                          value={get(formik.values, 'spec.infrastructure.spec.connectorRef')}
                          type={
                            <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
                              <Icon name={getIconByType('K8sCluster')}></Icon>
                              <Text>{getString('pipelineSteps.kubernetesInfraStep.kubernetesConnector')}</Text>
                            </Layout.Horizontal>
                          }
                          variableName="spec.infrastructure.spec.connector"
                          showRequiredField={false}
                          showDefaultField={false}
                          onChange={value => {
                            formik.setFieldValue('spec.infrastructure.spec.connector', value)
                          }}
                          isReadonly={readonly}
                          connectorReferenceFieldProps={{
                            accountIdentifier: accountId,
                            projectIdentifier,
                            orgIdentifier,
                            label: getString('connector'),
                            disabled: readonly,
                            gitScope: { repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true },
                            tooltipProps: {
                              dataTooltipId: 'k8InfraConnector'
                            }
                          }}
                        />
                      )}
                  </div>
                  <div className={cx(stepCss.formGroup, stepCss.lg)}>
                    <FormInput.MultiTextInput
                      name="spec.infrastructure.spec.namespace"
                      style={{ width: '400px' }}
                      disabled={readonly}
                      label={getString('common.namespace')}
                      placeholder={getString('pipeline.infraSpecifications.namespacePlaceholder')}
                      multiTextInputProps={{ expressions, textProps: { disabled: readonly }, allowableTypes }}
                    />
                    {getMultiTypeFromValue(get(formik.values, 'spec.infrastructure.spec.namespace')) ===
                      MultiTypeInputType.RUNTIME &&
                      !readonly && (
                        <ConfigureOptions
                          value={get(formik.values, 'spec.infrastructure.spec.namespace')}
                          type="String"
                          variableName="spec.infrastructure.spec.namespace"
                          showRequiredField={false}
                          showDefaultField={false}
                          onChange={value => {
                            formik.setFieldValue('spec.infrastructure.spec.namespace', value)
                          }}
                          isReadonly={readonly}
                          allowedValuesType={ALLOWED_VALUES_TYPE.TEXT}
                        />
                      )}
                  </div>

                  <Layout.Horizontal spacing="small">
                    <FormInput.MultiTextInput
                      name="spec.infrastructure.spec.resources.limits.memory"
                      label={getString('pipelineSteps.limitMemoryLabel')}
                      multiTextInputProps={{
                        expressions,
                        textProps: { disabled: readonly },
                        allowableTypes
                      }}
                      tooltipProps={{ dataTooltipId: 'setContainerResources' }}
                    />
                    {getMultiTypeFromValue(get(formik.values, 'spec.infrastructure.spec.resources.limits.memory')) ===
                      MultiTypeInputType.RUNTIME &&
                      !readonly && (
                        <ConfigureOptions
                          style={{ marginTop: 18 }}
                          value={get(formik.values, 'spec.infrastructure.spec.resources.limits.memory ')}
                          type="String"
                          variableName="spec.infrastructure.spec.resources.limits.memory"
                          showRequiredField={false}
                          showDefaultField={false}
                          onChange={value => {
                            formik.setFieldValue('spec.infrastructure.spec.resources.limits.memory', value)
                          }}
                          isReadonly={readonly}
                        />
                      )}
                    <FormInput.MultiTextInput
                      name="spec.infrastructure.spec.resources.limits.cpu"
                      label={getString('pipelineSteps.limitCPULabel')}
                      multiTextInputProps={{
                        expressions,
                        allowableTypes,
                        disabled: readonly
                      }}
                      tooltipProps={{ dataTooltipId: 'setContainerResources' }}
                    />
                    {getMultiTypeFromValue(get(formik.values, 'spec.infrastructure.spec.resources.limits.cpu')) ===
                      MultiTypeInputType.RUNTIME &&
                      !readonly && (
                        <ConfigureOptions
                          style={{ marginTop: 18 }}
                          value={get(formik.values, 'spec.infrastructure.spec.resources.limits.cpu')}
                          type="String"
                          variableName="spec.infrastructure.spec.resources.limits.cpu"
                          showRequiredField={false}
                          showDefaultField={false}
                          onChange={value => {
                            formik.setFieldValue('spec.infrastructure.spec.resources.limits.cpu', value)
                          }}
                          isReadonly={readonly}
                        />
                      )}
                  </Layout.Horizontal>
                </>
              )}

              <Accordion>
                <Accordion.Panel
                  id="optional-config"
                  summary={getString('common.optionalConfig')}
                  details={
                    <div className={cx(css.stepContainer)}>
                      <FormMultiTypeDurationField
                        name="timeout"
                        label={getString('pipelineSteps.timeoutLabel')}
                        multiTypeDurationProps={{ enableConfigureOptions: true, expressions, allowableTypes }}
                        disabled={readonly}
                      />
                      {stepType === StepType.SscaOrchestration && (
                        <Layout.Horizontal spacing="small">
                          <FormInput.MultiTextInput
                            name="spec.resources.limits.memory"
                            label={getString('pipelineSteps.limitMemoryLabel')}
                            multiTextInputProps={{
                              expressions,
                              textProps: { disabled: readonly },
                              allowableTypes
                            }}
                            tooltipProps={{ dataTooltipId: 'setContainerResources' }}
                          />
                          {getMultiTypeFromValue(get(formik.values, 'spec.resources.limits.memory')) ===
                            MultiTypeInputType.RUNTIME &&
                            !readonly && (
                              <ConfigureOptions
                                style={{ marginTop: 18 }}
                                value={get(formik.values, 'spec.resources.limits.memory')}
                                type="String"
                                variableName="spec.resources.limits.memory"
                                showRequiredField={false}
                                showDefaultField={false}
                                onChange={value => {
                                  formik.setFieldValue('spec.resources.limits.memory', value)
                                }}
                                isReadonly={readonly}
                              />
                            )}
                          <FormInput.MultiTextInput
                            name="spec.resources.limits.cpu"
                            label={getString('pipelineSteps.limitCPULabel')}
                            multiTextInputProps={{
                              expressions,
                              allowableTypes,
                              disabled: readonly
                            }}
                            tooltipProps={{ dataTooltipId: 'setContainerResources' }}
                          />
                          {getMultiTypeFromValue(get(formik.values, 'spec.resources.limits.cpu')) ===
                            MultiTypeInputType.RUNTIME &&
                            !readonly && (
                              <ConfigureOptions
                                style={{ marginTop: 18 }}
                                value={get(formik.values, 'spec.resources.limits.cpu')}
                                type="String"
                                variableName="spec.resources.limits.cpu"
                                showRequiredField={false}
                                showDefaultField={false}
                                onChange={value => {
                                  formik.setFieldValue('spec.resources.limits.cpu', value)
                                }}
                                isReadonly={readonly}
                              />
                            )}
                        </Layout.Horizontal>
                      )}
                    </div>
                  }
                />
              </Accordion>
            </div>
          </FormikForm>
        )
      }}
    </Formik>
  )
}

export const SscaOrchestrationStepEditWithRef = React.forwardRef(SscaOrchestrationStepEdit)