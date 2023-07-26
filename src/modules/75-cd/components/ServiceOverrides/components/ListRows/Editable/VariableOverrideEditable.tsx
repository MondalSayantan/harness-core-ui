/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useFormikContext } from 'formik'
import { FormInput, Layout, MultiTypeInputType } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import {
  VariableType,
  labelStringMap
} from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariableUtils'
import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'
import type { ServiceOverrideRowFormState } from '@cd/components/ServiceOverrides/ServiceOverridesUtils'
import { useServiceOverridesContext } from '@cd/components/ServiceOverrides/context/ServiceOverrideContext'

export function VariableOverrideEditable(): React.ReactElement {
  const { getString } = useStrings()
  const { values } = useFormikContext<ServiceOverrideRowFormState>()
  const { serviceOverrideType } = useServiceOverridesContext()
  const variableType = values.variables?.[0]?.type

  return (
    <Layout.Horizontal spacing={'small'} width={600} flex={{ justifyContent: 'space-between' }}>
      <FormInput.Text name="variables.0.name" placeholder={getString('name')} />
      <FormInput.Select
        name="variables.0.type"
        items={[
          { label: getString(labelStringMap[VariableType.String]), value: VariableType.String },
          { label: getString(labelStringMap[VariableType.Number]), value: VariableType.Number },
          { label: getString(labelStringMap[VariableType.Secret]), value: VariableType.Secret }
        ]}
        placeholder={getString('typeLabel')}
      />
      {variableType === VariableType.Secret ? (
        <MultiTypeSecretInput small name={'variables.0.value'} label="" disabled={false} />
      ) : (
        <FormInput.MultiTextInput
          name={'variables.0.value'}
          placeholder={getString('valueLabel')}
          label=""
          disabled={false}
          multiTextInputProps={{
            defaultValueToReset: '',
            textProps: {
              type: variableType === VariableType.Number ? 'number' : 'text'
            },
            allowableTypes:
              serviceOverrideType === 'ENV_GLOBAL_OVERRIDE' || serviceOverrideType === 'ENV_SERVICE_OVERRIDE'
                ? [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
                : [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
          }}
        />
      )}
    </Layout.Horizontal>
  )
}
