/*
 * Copyright 2023 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useEffect, useState } from 'react'
import { Container, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import CommonHealthSourceField from '@cv/pages/health-source/connectors/CommonHealthSource/components/CustomMetricForm/components/CommonCustomMetricFormContainer/CommonCustomMetricFormContainerLayout/components/CommonHealthSourceField/CommonHealthSourceField'
import { getHealthsourceType } from '@cv/pages/health-source/connectors/CommonHealthSource/components/CustomMetricForm/components/CommonCustomMetricFormContainer/CommonCustomMetricFormContainerLayout/CommonCustomMetricFormContainer.utils'

import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { useStrings } from 'framework/strings'
import type {
  AssignSectionType,
  FieldMapping
} from '@cv/pages/health-source/connectors/CommonHealthSource/CommonHealthSource.types'
import CustomMetricsSectionHeader from '@cv/pages/health-source/connectors/CommonHealthSource/components/CustomMetricForm/components/CustomMetricsSectionHeader'
import { FIELD_ENUM } from '@cv/pages/health-source/connectors/CommonHealthSource/CommonHealthSource.constants'
import { getTypeOfInput } from '@cv/utils/CommonUtils'
import type { RecordProps } from '@cv/pages/health-source/connectors/CommonHealthSource/components/CustomMetricForm/components/CommonCustomMetricFormContainer/CommonCustomMetricFormContainerLayout/CommonCustomMetricFormContainer.types'
import { HealthSourceParamValuesRequest } from 'services/cv'
import { ConnectorConfigureOptionsProps } from '@connectors/components/ConnectorConfigureOptions/ConnectorConfigureOptions'
import { ServiceInstanceTextInput } from './components/ServiceInstanceTextInput'
import { ServiceInstanceJSONSelector } from './components/ServiceInstanceJSONSelector'

export interface ServiceInstanceProps {
  serviceInstanceField?: string
  defaultServiceInstance?: string
  continuousVerificationEnabled?: boolean
  serviceInstanceConfig?: AssignSectionType['serviceInstance']
  recordProps: RecordProps
  fieldsToFetchRecords?: FieldMapping[]
}

export default function ServiceInstance({
  serviceInstanceField,
  defaultServiceInstance,
  continuousVerificationEnabled,
  serviceInstanceConfig,
  recordProps,
  fieldsToFetchRecords
}: ServiceInstanceProps): JSX.Element | null {
  const { getString } = useStrings()
  const { isTemplate, sourceData } = useContext(SetupSourceTabsContext)
  const { product, sourceType } = sourceData || {}
  const healthSourceType = getHealthsourceType(product, sourceType)
  const connectorIdentifier =
    (sourceData?.connectorRef as ConnectorConfigureOptionsProps)?.value ?? sourceData?.connectorRef
  const isConnectorRuntimeOrExpression = getMultiTypeFromValue(connectorIdentifier) !== MultiTypeInputType.FIXED

  const [metricInstanceMultiType, setMetricPathMultiType] = useState<MultiTypeInputType>(() =>
    getMultiTypeFromValue(serviceInstanceField)
  )

  /**
   * 💁‍♂️ RULES TO RENDER SERVICE INSTANCE FIELD AS TEXTINPUT
   *
   * 1. serviceInstanceConfig is not present (OR)
   * 2. serviceInstanceConfig is Invalid (OR)
   * 3. serviceInstanceConfig should have "type" as "TextInput"
   *
   */
  const isServiceInstanceTextField =
    !serviceInstanceConfig ||
    !Array.isArray(serviceInstanceConfig) ||
    serviceInstanceConfig[0].type === FIELD_ENUM.TEXT_INPUT

  useEffect(() => {
    if (isTemplate && serviceInstanceField && metricInstanceMultiType === MultiTypeInputType.FIXED) {
      setMetricPathMultiType(getTypeOfInput(serviceInstanceField))
    }
  }, [serviceInstanceField])

  if (!continuousVerificationEnabled) {
    return null
  }

  const getContent = (): JSX.Element => {
    if (isServiceInstanceTextField) {
      return (
        <ServiceInstanceTextInput
          defaultServiceInstance={defaultServiceInstance}
          serviceInstanceField={serviceInstanceField}
        />
      )
    } else if (serviceInstanceConfig && serviceInstanceConfig[0].type === FIELD_ENUM.DROPDOWN) {
      const serviceInstanceConfigField = serviceInstanceConfig[0]
      return (
        <CommonHealthSourceField
          field={serviceInstanceConfigField}
          isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
          connectorIdentifier={connectorIdentifier}
          providerType={healthSourceType as HealthSourceParamValuesRequest['providerType']}
          fieldsToFetchRecords={fieldsToFetchRecords}
        />
      )
    } else {
      return <ServiceInstanceJSONSelector serviceInstanceConfig={serviceInstanceConfig} recordProps={recordProps} />
    }
  }

  return (
    <Container>
      <>
        <CustomMetricsSectionHeader
          sectionTitle={getString('cv.monitoringSources.commonHealthSource.assign.serviceInstance.title')}
          sectionSubTitle={getString('cv.monitoringSources.commonHealthSource.assign.serviceInstance.helptext')}
        />

        <Container width="350px">{getContent()}</Container>
      </>
    </Container>
  )
}
