/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text } from '@harness/uicore'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { TerragruntPlanVariableStepProps, TGPlanFormData } from '../../Common/Terragrunt/TerragruntInterface'
import { ConfigVariables } from './TgPlanConfigSection'
import css from '@cd/components/PipelineSteps/Common/Terraform/TerraformStep.module.scss'
import pipelineVariableCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export function TerragruntPlanVariableStep(props: TerragruntPlanVariableStepProps): React.ReactElement {
  const { variablesData = {} as TGPlanFormData, metadataMap, initialValues } = props

  const { getString } = useStrings()
  return (
    <>
      <VariablesListTable
        data={variablesData.spec?.provisionerIdentifier}
        originalData={initialValues.spec?.provisionerIdentifier}
        metadataMap={metadataMap}
        className={pipelineVariableCss.variablePaddingL3}
      />
      <ConfigVariables {...props} />
      {(get(variablesData?.spec, 'configuration.backendConfig.spec.content') ||
        get(variablesData?.spec, 'configuration.backendConfig.spec.store.spec')) && (
        <>
          <Text className={css.stepTitle}>{getString('pipelineSteps.backendConfig')}</Text>
          <VariablesListTable
            data={variablesData?.spec?.configuration?.backendConfig?.spec}
            originalData={initialValues.spec?.configuration?.backendConfig?.spec}
            metadataMap={metadataMap}
            className={pipelineVariableCss.variablePaddingL4}
          />
          <VariablesListTable
            data={variablesData?.spec?.configuration?.backendConfig?.spec?.store?.spec}
            originalData={initialValues.spec?.configuration?.backendConfig?.spec?.store?.spec}
            metadataMap={metadataMap}
            className={pipelineVariableCss.variablePaddingL4}
          />
        </>
      )}
      {variablesData?.spec?.configuration?.environmentVariables && (
        <Text className={css.stepTitle}>{getString('environmentVariables')}</Text>
      )}
      {((variablesData?.spec?.configuration?.environmentVariables as []) || [])?.map((envVar, index) => {
        return (
          <VariablesListTable
            key={envVar}
            data={variablesData.spec?.configuration?.environmentVariables?.[index]}
            originalData={initialValues.spec?.configuration?.environmentVariables?.[index]}
            metadataMap={metadataMap}
            className={pipelineVariableCss.variablePaddingL4}
          />
        )
      })}
    </>
  )
}