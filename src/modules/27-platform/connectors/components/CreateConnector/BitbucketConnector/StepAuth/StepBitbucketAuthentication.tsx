/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import cx from 'classnames'
import {
  Layout,
  Button,
  Formik,
  FormInput,
  Text,
  FormikForm as Form,
  StepProps,
  Container,
  SelectOption,
  ButtonVariation,
  PageSpinner
} from '@harness/uicore'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import type { FormikProps } from 'formik'
import { setupBitbucketFormData, GitConnectionType } from '@platform/connectors/pages/connectors/utils/ConnectorUtils'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import type { ConnectorConfigDTO, ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'
import SSHSecretInput from '@secrets/components/SSHSecretInput/SSHSecretInput'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import { useStrings } from 'framework/strings'
import { GitAuthTypes } from '@platform/connectors/pages/connectors/utils/ConnectorHelper'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@platform/connectors/constants'
import type { ScopedObjectDTO } from '@common/components/EntityReference/EntityReference'
import { getCommonConnectorsValidationSchema } from '../../CreateConnectorUtils'
import { useConnectorWizard } from '../../../CreateConnectorWizard/ConnectorWizardContext'
import commonStyles from '@platform/connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from './StepBitbucketAuthentication.module.scss'
import commonCss from '../../commonSteps/ConnectorCommonStyles.module.scss'

interface StepBitbucketAuthenticationProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

interface BitbucketAuthenticationProps {
  onConnectorCreated: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  connectorInfo: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  helpPanelReferenceId?: string
}

interface BitbucketFormInterface {
  connectionType: string
  authType: string
  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
  sshKey: SecretReferenceInterface | void
  enableAPIAccess: boolean
  apiAuthType: string
  apiAccessUsername: TextReferenceInterface | void
  accessToken: SecretReferenceInterface | void
}

const defaultInitialFormData: BitbucketFormInterface = {
  connectionType: GitConnectionType.HTTP,
  authType: GitAuthTypes.USER_PASSWORD,
  username: undefined,
  password: undefined,
  sshKey: undefined,
  enableAPIAccess: false,
  apiAuthType: GitAuthTypes.USER_TOKEN,
  apiAccessUsername: undefined,
  accessToken: undefined
}

const RenderBitbucketAuthForm: React.FC<{ formikProps: FormikProps<BitbucketFormInterface>; scope?: ScopedObjectDTO }> =
  props => {
    const { formikProps, scope } = props
    const { getString } = useStrings()
    return (
      <>
        <TextReference
          name="username"
          stringId="username"
          type={formikProps.values.username ? formikProps.values.username?.type : ValueType.TEXT}
        />
        <SecretInput name="password" label={getString('password')} scope={scope} />
      </>
    )
  }

const RenderAPIAccessFormWrapper: React.FC<{
  formikProps: FormikProps<BitbucketFormInterface>
  scope?: ScopedObjectDTO
}> = props => {
  const { formikProps, scope } = props
  const { getString } = useStrings()

  const apiAuthOptions: Array<SelectOption> = [
    {
      label: getString('usernameToken'),
      value: GitAuthTypes.USER_TOKEN
    }
  ]

  useEffect(() => {
    formikProps.setFieldValue('apiAuthType', GitAuthTypes.USER_TOKEN)
  }, [])

  return (
    <>
      <Container className={css.authHeaderRow}>
        <Text font={{ variation: FontVariation.H6 }}>{getString('common.git.APIAuthentication')}</Text>
        <FormInput.Select
          name="apiAuthType"
          items={apiAuthOptions}
          className={commonStyles.authTypeSelect}
          value={apiAuthOptions[0]}
        />
      </Container>
      <TextReference
        name="apiAccessUsername"
        stringId="username"
        type={formikProps.values.apiAccessUsername ? formikProps.values.apiAccessUsername?.type : ValueType.TEXT}
      />
      <SecretInput name="accessToken" label={getString('personalAccessToken')} scope={scope} />
    </>
  )
}

const StepBitbucketAuthentication: React.FC<
  StepProps<StepBitbucketAuthenticationProps> & BitbucketAuthenticationProps
> = props => {
  const { getString } = useStrings()
  const { prevStepData, nextStep, accountId } = props
  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(true && props.isEditMode)

  useConnectorWizard({
    helpPanel: props.helpPanelReferenceId ? { referenceId: props.helpPanelReferenceId, contentWidth: 900 } : undefined
  })

  const authOptions: Array<SelectOption> = [
    {
      label: getString('usernamePassword'),
      value: GitAuthTypes.USER_PASSWORD
    }
  ]

  useEffect(() => {
    if (loadingConnectorSecrets) {
      if (props.isEditMode) {
        if (props.connectorInfo) {
          setupBitbucketFormData(props.connectorInfo, accountId).then(data => {
            setInitialValues(data as BitbucketFormInterface)
            setLoadingConnectorSecrets(false)
          })
        } else {
          setLoadingConnectorSecrets(false)
        }
      }
    }
  }, [loadingConnectorSecrets])

  const handleSubmit = (formData: ConnectorConfigDTO) => {
    trackEvent(ConnectorActions.AuthenticationStepSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.BitBucket
    })
    nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData } as StepBitbucketAuthenticationProps)
  }
  const { trackEvent } = useTelemetry()
  useTrackEvent(ConnectorActions.AuthenticationStepLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.BitBucket
  })

  const scope: ScopedObjectDTO | undefined = props.isEditMode
    ? {
        orgIdentifier: prevStepData?.orgIdentifier,
        projectIdentifier: prevStepData?.projectIdentifier
      }
    : undefined

  return loadingConnectorSecrets ? (
    <PageSpinner />
  ) : (
    <Layout.Vertical
      width="60%"
      className={cx(css.secondStep, commonCss.connectorModalMinHeight, commonCss.stepContainer)}
    >
      <Text font={{ variation: FontVariation.H3 }}>{getString('credentials')}</Text>

      <Formik
        initialValues={{
          ...initialValues,
          ...prevStepData
        }}
        formName="bitbAuthForm"
        validationSchema={getCommonConnectorsValidationSchema(getString).concat(
          Yup.object().shape({
            apiAuthType: Yup.string().when('enableAPIAccess', {
              is: val => val,
              then: Yup.string().trim().required(getString('validation.authType')),
              otherwise: Yup.string().nullable()
            }),
            apiAccessUsername: Yup.string().when(['enableAPIAccess', 'apiAuthType'], {
              is: (enableAPIAccess, apiAuthType) => enableAPIAccess && apiAuthType === GitAuthTypes.USER_TOKEN,
              then: Yup.string().trim().required(getString('validation.username')),
              otherwise: Yup.string().nullable()
            }),
            accessToken: Yup.object().when(['enableAPIAccess', 'apiAuthType'], {
              is: (enableAPIAccess, apiAuthType) => enableAPIAccess && apiAuthType === GitAuthTypes.USER_TOKEN,
              then: Yup.object().required(getString('platform.connectors.validation.personalAccessToken')),
              otherwise: Yup.object().nullable()
            })
          })
        )}
        onSubmit={handleSubmit}
      >
        {formikProps => (
          <Form className={cx(commonCss.fullHeight, commonCss.fullHeightDivsWithFlex)}>
            <Container className={cx(css.stepFormWrapper, commonCss.paddingTop8)}>
              {formikProps.values.connectionType === GitConnectionType.SSH ? (
                <Layout.Horizontal spacing="medium" flex={{ alignItems: 'baseline' }}>
                  <Text font={{ variation: FontVariation.H6 }}>{getString('authentication')}</Text>
                  <SSHSecretInput name="sshKey" label={getString('SSH_KEY')} />
                </Layout.Horizontal>
              ) : (
                <Container>
                  <Container className={css.authHeaderRow} flex={{ alignItems: 'baseline' }}>
                    <Text font={{ variation: FontVariation.H6 }}>{getString('authentication')}</Text>
                    <FormInput.Select name="authType" items={authOptions} className={commonStyles.authTypeSelect} />
                  </Container>
                  <RenderBitbucketAuthForm formikProps={{ ...formikProps }} scope={scope} />
                </Container>
              )}

              <FormInput.CheckBox
                name="enableAPIAccess"
                label={getString('common.git.enableAPIAccess')}
                padding={{ left: 'xxlarge' }}
              />
              <Text font="small" className={commonCss.bottomMargin4}>
                {getString('common.git.APIAccessDescription')}
              </Text>
              {formikProps.values.enableAPIAccess ? (
                <RenderAPIAccessFormWrapper formikProps={{ ...formikProps }} scope={scope} />
              ) : null}
            </Container>
            <Layout.Horizontal spacing="medium">
              <Button
                text={getString('back')}
                icon="chevron-left"
                onClick={() => props?.previousStep?.(props?.prevStepData)}
                data-name="bitbucketBackButton"
                variation={ButtonVariation.SECONDARY}
              />
              <Button
                type="submit"
                intent="primary"
                text={getString('continue')}
                rightIcon="chevron-right"
                variation={ButtonVariation.PRIMARY}
              />
            </Layout.Horizontal>
          </Form>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

export default StepBitbucketAuthentication
