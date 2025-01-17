/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Layout,
  Button,
  FormInput,
  MultiTypeInputType,
  getMultiTypeFromValue,
  ButtonVariation,
  SelectOption,
  AllowedTypes
} from '@harness/uicore'
import cx from 'classnames'

import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { FieldArray, FormikValues } from 'formik'

import { isBoolean } from 'lodash-es'
import { String, useStrings } from 'framework/strings'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { FormMultiTypeCheckboxField } from '@common/components'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'

import { useHelmCmdFlags } from 'services/cd-ng'
import { useDeepCompareEffect } from '@common/hooks'
import { MonacoTextField } from '@common/components/MonacoTextField/MonacoTextField'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import type { CommandFlags, HelmOCIVersionOptions, HelmVersionOptions } from '../ManifestInterface'

import helmcss from './HelmWithGIT/HelmWithGIT.module.scss'
import css from './ManifestWizardSteps.module.scss'
interface HelmAdvancedStepProps {
  expressions: string[]
  allowableTypes: AllowedTypes
  formik: FormikValues
  isReadonly?: boolean
  deploymentType: string
  helmVersion: HelmVersionOptions | HelmOCIVersionOptions
  helmStore: string
}

function HelmAdvancedStepSection({
  formik,
  expressions,
  allowableTypes,
  isReadonly,
  deploymentType,
  helmVersion,
  helmStore
}: HelmAdvancedStepProps): React.ReactElement {
  const { getString } = useStrings()
  const defaultValueToReset = [{ commandType: '', flag: '', id: uuid('', nameSpace()) }]
  const [commandFlagOptions, setCommandFlagOptions] = useState<Record<string, SelectOption[]>>({ V2: [], V3: [] })
  const isSkipVersioningDisabled =
    isBoolean(formik?.values?.enableDeclarativeRollback) && !!formik?.values?.enableDeclarativeRollback

  const { CDS_HELM_FETCH_CHART_METADATA_NG } = useFeatureFlags()

  const { data: commandFlags, refetch: refetchCommandFlags } = useHelmCmdFlags({
    queryParams: {
      serviceSpecType: deploymentType as string,
      version: helmVersion,
      storeType: helmStore
    },
    lazy: true
  })

  useEffect(() => {
    if (!commandFlagOptions[helmVersion]?.length) {
      refetchCommandFlags()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helmVersion])

  useDeepCompareEffect(() => {
    const commandFlagSelectOption = {
      ...commandFlagOptions,
      [helmVersion]: commandFlags?.data?.map(commandFlag => ({ label: commandFlag, value: commandFlag }))
    }
    setCommandFlagOptions(commandFlagSelectOption as Record<string, SelectOption[]>)
  }, [commandFlags?.data, helmVersion])

  const commandFlagLabel = (): React.ReactElement => {
    return (
      <Layout.Horizontal flex spacing="small">
        <String tagName="div" stringID="pipeline.manifestType.helmCommandFlagLabel" />
      </Layout.Horizontal>
    )
  }

  return (
    <div className={helmcss.helmAdvancedSteps}>
      {deploymentType === ServiceDeploymentType.Kubernetes && (
        <Layout.Horizontal
          width={'90%'}
          flex={{ justifyContent: 'flex-start', alignItems: 'center' }}
          margin={{ bottom: 'small' }}
        >
          <FormMultiTypeCheckboxField
            name="enableDeclarativeRollback"
            label={getString('pipeline.manifestType.enableDeclarativeRollback')}
            className={cx(helmcss.checkbox, helmcss.halfWidth)}
            multiTypeTextbox={{ expressions, allowableTypes }}
          />
          {getMultiTypeFromValue(formik.values?.enableDeclarativeRollback) === MultiTypeInputType.RUNTIME && (
            <ConfigureOptions
              value={(formik.values?.enableDeclarativeRollback || '') as string}
              type="String"
              variableName="enableDeclarativeRollback"
              showRequiredField={false}
              showDefaultField={false}
              onChange={value => formik.setFieldValue('enableDeclarativeRollback', value)}
              style={{ alignSelf: 'center', marginTop: 11 }}
              className={cx(css.addmarginTop)}
              isReadonly={isReadonly}
            />
          )}
        </Layout.Horizontal>
      )}
      <Layout.Horizontal width={'90%'} flex={{ justifyContent: 'flex-start', alignItems: 'center' }}>
        <FormMultiTypeCheckboxField
          key={isSkipVersioningDisabled.toString()}
          name="skipResourceVersioning"
          label={getString('skipResourceVersion')}
          className={cx(helmcss.checkbox, helmcss.halfWidth)}
          multiTypeTextbox={{ expressions, allowableTypes, disabled: isSkipVersioningDisabled }}
          disabled={isSkipVersioningDisabled}
        />
        {getMultiTypeFromValue(formik.values?.skipResourceVersioning) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={(formik.values?.skipResourceVersioning || '') as string}
            type="String"
            variableName="skipResourceVersioning"
            showRequiredField={false}
            showDefaultField={false}
            onChange={value => formik.setFieldValue('skipResourceVersioning', value)}
            style={{ alignSelf: 'center', marginTop: 11 }}
            className={cx(css.addmarginTop)}
            isReadonly={isReadonly}
          />
        )}
      </Layout.Horizontal>
      <Layout.Horizontal
        width={'90%'}
        flex={{ justifyContent: 'flex-start', alignItems: 'center' }}
        margin={{ top: 'medium' }}
      >
        {CDS_HELM_FETCH_CHART_METADATA_NG ? (
          <>
            <FormMultiTypeCheckboxField
              name="fetchHelmChartMetadata"
              label={getString('pipeline.manifestType.fetchHelmChartMetadata')}
              className={cx(helmcss.checkbox, helmcss.halfWidth)}
              multiTypeTextbox={{ expressions, allowableTypes, disabled: isSkipVersioningDisabled }}
              disabled={isSkipVersioningDisabled}
            />
            {getMultiTypeFromValue(formik.values?.skipResourceVersioning) === MultiTypeInputType.RUNTIME && (
              <ConfigureOptions
                value={(formik.values?.skipResourceVersioning || '') as string}
                type="String"
                variableName="fetchHelmChartMetadata"
                showRequiredField={false}
                showDefaultField={false}
                onChange={value => formik.setFieldValue('fetchHelmChartMetadata', value)}
                style={{ alignSelf: 'center', marginTop: 11 }}
                className={cx(css.addmarginTop)}
                isReadonly={isReadonly}
              />
            )}
          </>
        ) : null}
      </Layout.Horizontal>

      {commandFlagOptions[helmVersion]?.length > 0 && (
        <div className={helmcss.commandFlags}>
          <MultiTypeFieldSelector
            defaultValueToReset={defaultValueToReset}
            name={'commandFlags'}
            label={commandFlagLabel()}
            disableTypeSelection
          >
            <FieldArray
              name="commandFlags"
              render={({ push, remove }) => (
                <Layout.Vertical>
                  {formik.values?.commandFlags?.map((commandFlag: CommandFlags, index: number) => (
                    <Layout.Horizontal key={commandFlag.id} margin={{ top: 'medium' }}>
                      <div
                        className={cx(helmcss.commandType, {
                          [helmcss.commandFlagType]: index !== 0
                        })}
                      >
                        <FormInput.Select
                          name={`commandFlags[${index}].commandType`}
                          label={index === 0 ? getString('pipeline.fieldLabels.commandType') : ''}
                          items={commandFlagOptions[helmVersion]}
                          placeholder={getString('pipeline.fieldPlaceholders.commandType')}
                          className={helmcss.commandTypeSelect}
                        />
                      </div>
                      <div
                        className={cx({
                          [helmcss.helmCommandFlags]: index !== 0
                        })}
                      >
                        <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
                          <MultiTypeFieldSelector
                            name={`commandFlags[${index}].flag`}
                            label={index === 0 ? getString('flag') : ''}
                            allowedTypes={allowableTypes}
                            style={{ width: 450 }}
                            skipRenderValueInExpressionLabel
                            expressionRender={() => (
                              <MonacoTextField
                                name={`commandFlags[${index}].flag`}
                                expressions={expressions}
                                height={80}
                                fullScreenAllowed
                                fullScreenTitle={getString('flag')}
                              />
                            )}
                          >
                            <MonacoTextField
                              name={`commandFlags[${index}].flag`}
                              expressions={expressions}
                              height={80}
                              fullScreenAllowed
                              fullScreenTitle={getString('flag')}
                            />
                          </MultiTypeFieldSelector>

                          <Button
                            minimal
                            icon="main-trash"
                            className={cx({
                              [helmcss.delBtn]: index === 0
                            })}
                            onClick={() => remove(index)}
                          />
                        </Layout.Horizontal>
                      </div>
                    </Layout.Horizontal>
                  ))}
                  {!!(formik.values?.commandFlags?.length < commandFlagOptions[helmVersion].length) && (
                    <span>
                      <Button
                        minimal
                        text={getString('add')}
                        variation={ButtonVariation.PRIMARY}
                        onClick={() => push({ commandType: '', flag: '', id: uuid('', nameSpace()) })}
                      />
                    </span>
                  )}
                </Layout.Vertical>
              )}
            />
          </MultiTypeFieldSelector>
        </div>
      )}
    </div>
  )
}

export default HelmAdvancedStepSection
