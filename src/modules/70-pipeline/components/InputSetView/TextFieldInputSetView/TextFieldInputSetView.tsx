/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import { DataTooltipInterface, FormInput, MultiTextInputProps, MultiTypeInputType } from '@harness/uicore'

import { shouldRenderRunTimeInputViewWithAllowedValues } from '@pipeline/utils/CIUtils'
import { useRenderMultiTypeInputWithAllowedValues } from '../utils/utils'

interface TextFieldInputSetViewProps {
  name: string
  label: string
  fieldPath: string
  template: any
  disabled?: boolean
  placeholder?: string
  readonly?: boolean
  tooltipProps?: DataTooltipInterface
  onChange?: () => void
  multiTextInputProps?: Omit<MultiTextInputProps, 'name'>
}

export function TextFieldInputSetView(props: TextFieldInputSetViewProps): JSX.Element {
  const {
    name,
    label,
    placeholder,
    disabled,
    template,
    fieldPath,
    readonly,
    tooltipProps,
    onChange,
    multiTextInputProps
  } = props

  const { getMultiTypeInputWithAllowedValues } = useRenderMultiTypeInputWithAllowedValues({
    name: name,
    labelKey: label,
    placeholderKey: placeholder,
    fieldPath: fieldPath,
    allowedTypes: defaultTo(multiTextInputProps?.allowableTypes, [MultiTypeInputType.FIXED]),
    template: template,
    readonly: readonly,
    tooltipProps: tooltipProps
  })

  if (shouldRenderRunTimeInputViewWithAllowedValues(fieldPath, template)) {
    return getMultiTypeInputWithAllowedValues()
  }

  return (
    <FormInput.MultiTextInput
      name={name}
      label={label}
      disabled={disabled}
      multiTextInputProps={multiTextInputProps}
      onChange={onChange}
    />
  )
}
