/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import * as Yup from 'yup'
import { v4 as uuid } from 'uuid'
import { isEmpty } from 'lodash-es'
import { yupToFormErrors, FormikErrors } from 'formik'
import { PipelineStep, StepProps } from '@pipeline/components/PipelineSteps/PipelineStep'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import type { StringsMap } from 'stringTypes'
import type { StringNGVariable } from 'services/pipeline-ng'
import TerragruntInputStep from '../Common/Terragrunt/InputSteps/TerragruntInputStep'
import TerragruntEditView from '../Common/Terragrunt/EditView/TerragruntEditView'
import type { TerragruntData, TerragruntVariableStepProps } from '../Common/Terragrunt/TerragruntInterface'
import { onSubmitTerragruntData } from '../Common/Terragrunt/TerragruntHelper'
import { TerragruntVariableStep } from '../Common/Terragrunt/VariableView/TerragruntVariableView'
import { ConfigurationTypes } from '../Common/Terraform/TerraformInterfaces'

const TerragruntDestroyWidgetWithRef = React.forwardRef(TerragruntEditView)

export class TerragruntDestroy extends PipelineStep<TerragruntData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }
  protected type = StepType.TerragruntDestroy
  protected referenceId = 'terragruntDestroyStep'
  protected defaultValues: TerragruntData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.TerragruntDestroy,
    spec: {
      provisionerIdentifier: '',
      configuration: {
        type: ConfigurationTypes.InheritFromApply
      }
    }
  }
  protected stepIcon: IconName = 'terragrunt-destroy'
  protected stepName = 'Terragrunt Destroy'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.TerraformDestroy'

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<TerragruntData>): FormikErrors<TerragruntData> {
    /* istanbul ignore next */
    const errors = {} as any
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm

    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      if (isRequired) {
        /* istanbul ignore next */
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })

      try {
        timeout.validateSync(data)
      } catch (e) {
        if (e instanceof Yup.ValidationError) {
          /* istanbul ignore next */
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    if (isEmpty(errors.spec)) {
      /* istanbul ignore next */
      delete errors.spec
    }

    return errors
  }
  private getInitialValues(data: TerragruntData): TerragruntData {
    const envVars = data.spec?.configuration?.spec?.environmentVariables as StringNGVariable[]
    const formData = {
      ...data,
      spec: {
        ...data.spec,
        configuration: {
          ...data.spec?.configuration,
          spec: {
            ...data.spec?.configuration?.spec,
            targets: Array.isArray(data.spec?.configuration?.spec?.targets)
              ? data.spec?.configuration?.spec?.targets.map(target => ({
                  value: target,
                  id: uuid()
                }))
              : [{ value: '', id: uuid() }],
            environmentVariables: Array.isArray(envVars)
              ? envVars.map(variable => ({
                  key: variable.name,
                  value: variable.value,
                  id: uuid()
                }))
              : [{ key: '', value: '', id: uuid() }]
          }
        }
      }
    }
    return formData
  }
  /* istanbul ignore next */
  processFormData(data: any): TerragruntData {
    return onSubmitTerragruntData(data)
  }

  renderStep(props: StepProps<TerragruntData, TerragruntVariableStepProps>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep
    } = props

    if (this.isTemplatizedView(stepViewType)) {
      return (
        <TerragruntInputStep
          initialValues={initialValues}
          onUpdate={onUpdate}
          allValues={inputSetData?.allValues}
          stepViewType={stepViewType}
          readonly={inputSetData?.readonly}
          inputSetData={inputSetData}
          path={inputSetData?.path}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <TerragruntVariableStep
          {...(customStepProps as TerragruntVariableStepProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }
    return (
      <TerragruntDestroyWidgetWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        onChange={data => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        isNewStep={isNewStep}
        stepViewType={stepViewType}
        ref={formikRef}
        stepType={StepType.TerragruntDestroy}
      />
    )
  }
}