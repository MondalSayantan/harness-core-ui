/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useMemo, useState } from 'react'
import cx from 'classnames'
import {
  ExpressionAndRuntimeTypeProps,
  getMultiTypeFromValue,
  MultiTypeInputValue,
  MultiTypeInputType,
  DataTooltipInterface,
  Container,
  FormError,
  FormikTooltipContext,
  useToaster,
  ButtonVariation,
  SelectOption,
  sortByLastModified,
  sortByCreated,
  sortByName,
  SortMethod,
  FormInput
} from '@harness/uicore'
import { connect, FormikContextType } from 'formik'
import { FormGroup, Intent } from '@blueprintjs/core'
import { ItemRenderer } from '@blueprintjs/select'
import { get, isEmpty, set } from 'lodash-es'
import produce from 'immer'
import { useModalHook } from '@harness/use-modal'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import useCreateConnectorModal from '@platform/connectors/modals/ConnectorModal/useCreateConnectorModal'
import useCreateConnectorMultiTypeModal from '@platform/connectors/modals/ConnectorModal/useCreateConnectorMultiTypeModal'
import { useGetSecretsManagerConnectorsHook } from '@platform/connectors/pages/connectors/hooks/useGetSecretsManagerConnectors/useGetSecretsManagerConnectors'

import {
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  ConnectorResponse,
  ResponsePageConnectorResponse,
  useGetConnector
} from 'services/cd-ng'
import type { ConfigureOptionsProps } from '@common/components/ConfigureOptions/ConfigureOptions'
import { Scope } from '@common/interfaces/SecretsInterface'
import { UseStringsReturn, useStrings } from 'framework/strings'
import { errorCheck } from '@common/utils/formikHelpers'
import {
  getIdentifierFromValue,
  getScopeFromDTO,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import {
  MultiTypeReferenceInput,
  MultiTypeReferenceInputProps,
  ReferenceSelectProps
} from '@common/components/ReferenceSelect/ReferenceSelect'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacButton from '@rbac/components/Button/Button'
import type { ItemInterface } from '@common/components/AddDrawer/AddDrawer'
import { InputSetFunction, parseInput } from '@common/components/ConfigureOptions/ConfigureOptionsUtils'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import {
  ConnectorReferenceFieldProps,
  getReferenceFieldProps,
  getEditRenderer,
  InlineSelectionInterface,
  ConnectorSelectedValue,
  getSelectedRenderer,
  getConnectorStatusCall
} from './ConnectorReferenceField'
import { Connectors } from '../../constants'
import AddConnectorsDrawer from './AddConnectorsDrawer'
import { ConnectorConfigureOptions } from '../ConnectorConfigureOptions/ConnectorConfigureOptions'
import css from './ConnectorReferenceField.module.scss'

export interface MultiTypeGitProviderAndConnectorFieldConfigureOptionsProps
  extends Omit<ConfigureOptionsProps, 'value' | 'type' | 'variableName'> {
  variableName?: ConfigureOptionsProps['variableName']
}
export interface MultiTypeGitProviderAndConnectorFieldProps extends Omit<ConnectorReferenceFieldProps, 'onChange'> {
  onChange?: ExpressionAndRuntimeTypeProps['onChange']
  formik?: FormikContextType<any>
  multiTypeProps?: Omit<MultiTypeReferenceInputProps<ConnectorReferenceDTO>, 'name' | 'referenceSelectProps'>
  isNewConnectorLabelVisible?: boolean
  createNewLabel?: string
  configureOptionsProps?: MultiTypeGitProviderAndConnectorFieldConfigureOptionsProps
  enableConfigureOptions?: boolean
  style?: React.CSSProperties
  tooltipProps?: DataTooltipInterface
  multitypeInputValue?: MultiTypeInputType
  connectorLabelClass?: string
  onLoadingFinish?: () => void
  mini?: boolean
  isDrawerMode?: boolean
  templateProps?: {
    isTemplatizedView: true
    templateValue: string | SelectOption | undefined
  }
  version?: string
  renderRecordDisabledWarning?: JSX.Element
  connectorAndRepoNamePath?: string
}
export interface ConnectorReferenceDTO extends ConnectorInfoDTO {
  status: ConnectorResponse['status']
}

export const GitProviderOptions = (getString: UseStringsReturn['getString']): SelectOption[] => {
  return [
    { label: getString('harness'), value: Connectors.Harness },
    {
      label: getString('common.selectOtherGitProviders'),
      value: getString('stepPalette.others')
    }
  ]
}

export const MultiTypeGitProviderAndConnectorField = (
  props: MultiTypeGitProviderAndConnectorFieldProps
): React.ReactElement => {
  const {
    defaultScope,
    accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    type = 'K8sCluster',
    category,
    name,
    label,
    onChange,
    width = 366,
    formik,
    placeholder,
    isNewConnectorLabelVisible = true,
    configureOptionsProps,
    enableConfigureOptions = true,
    style,
    gitScope,
    multiTypeProps = {},
    multitypeInputValue,
    connectorLabelClass: connectorLabelClassFromProps = '',
    createNewLabel,
    mini,
    isDrawerMode = false,
    templateProps,
    renderRecordDisabledWarning,
    version,
    connectorAndRepoNamePath,
    ...restProps
  } = props
  const hasError = errorCheck(name, formik)
  const {
    intent = hasError ? Intent.DANGER : Intent.NONE,
    helperText = hasError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    disabled,
    ...rest
  } = restProps
  const selected = get(formik?.values, name, '') ?? ''
  const [selectedValue, setSelectedValue] = React.useState(selected)
  const [inlineSelection, setInlineSelection] = React.useState<InlineSelectionInterface>({
    selected: false,
    inlineModalClosed: false
  })
  const { PL_FAVORITES } = useFeatureFlags()
  const scopeFromSelected =
    typeof selectedValue === 'string' && selectedValue.length > 0
      ? getScopeFromValue(selectedValue || '')
      : selected.length > 0
      ? getScopeFromValue(selected || '')
      : selectedValue?.scope
  const selectedRef =
    typeof selected === 'string' ? getIdentifierFromValue(selected || '') : selectedValue?.connector?.identifier

  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  const [multiType, setMultiType] = React.useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const [connectorStatusCheckInProgress, setConnectorStatusCheckInProgress] = React.useState(false)
  const [connectorStatus, setConnectorStatus] = React.useState(typeof selected !== 'string' && selected?.live)
  const { preference: sortPreference = SortMethod.Newest, setPreference: setSortPreference } =
    usePreferenceStore<SortMethod>(PreferenceScope.USER, `sort-select-connector`)

  const [isConnectorEdited, setIsConnectorEdited] = useState(false)
  const { showError } = useToaster()

  const getConnectorStatus = (): void => {
    if (typeof selected !== 'string') {
      setConnectorStatusCheckInProgress(true)
      getConnectorStatusCall(selected, accountIdentifier)
        .then(
          status => {
            setConnectorStatus(status)
          },
          err => {
            setConnectorStatus(false)
            showError(err)
          }
        )
        .finally(() => {
          setConnectorStatusCheckInProgress(false)
          setIsConnectorEdited(false)
        })
    }
  }
  const isSecretManagerCategory = React.useMemo(() => {
    return category === 'SECRET_MANAGER'
  }, [category])

  const {
    data: connectorData,
    loading,
    refetch,
    error
  } = useGetConnector({
    identifier: selectedRef as string,
    queryParams: {
      accountIdentifier,
      orgIdentifier: scopeFromSelected === Scope.ORG || scopeFromSelected === Scope.PROJECT ? orgIdentifier : undefined,
      projectIdentifier: scopeFromSelected === Scope.PROJECT ? projectIdentifier : undefined,
      ...(!isEmpty(gitScope?.repo) && !isEmpty(gitScope?.branch)
        ? {
            branch: gitScope?.branch,
            repoIdentifier: gitScope?.repo,
            getDefaultFromOtherRepo: true
          }
        : {})
    },
    lazy: true
  })
  const [canUpdate] = usePermission(
    {
      resource: {
        resourceType: ResourceType.CONNECTOR
      },
      permissions: [PermissionIdentifier.UPDATE_CONNECTOR]
    },
    []
  )

  React.useEffect(() => {
    if (multiType === MultiTypeInputType.FIXED && getMultiTypeFromValue(selected) === MultiTypeInputType.FIXED) {
      if (typeof selected === 'string' && selected.length > 0) {
        refetch()
      }
      if (multitypeInputValue !== undefined) {
        setSelectedValue(selected)
      }
    } else {
      setSelectedValue(selected)
    }
    if (typeof selected !== 'string' && selected && (selected as ConnectorSelectedValue).connector) {
      if (isConnectorEdited) {
        getConnectorStatus()
      } else {
        setConnectorStatus((selected as ConnectorSelectedValue).live)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  React.useEffect(() => {
    if (typeof selectedValue !== 'string' && selectedValue && (selectedValue as ConnectorSelectedValue).connector) {
      if (isConnectorEdited) {
        getConnectorStatus()
      } else {
        setConnectorStatus((selectedValue as ConnectorSelectedValue).live)
      }
    }
  }, [selectedValue, isConnectorEdited])

  React.useEffect(() => {
    if (typeof selected === 'string' && getMultiTypeFromValue(selected) === MultiTypeInputType.FIXED && !loading) {
      if (connectorData && connectorData?.data?.connector?.name) {
        const scope = getScopeFromValue(selected || '')
        const value = {
          label: connectorData?.data?.connector?.name,
          value:
            scope === Scope.ORG || scope === Scope.ACCOUNT
              ? `${scope}.${connectorData?.data?.connector?.identifier}`
              : connectorData?.data?.connector?.identifier,
          scope: scope,
          live: connectorData?.data?.status?.status === 'SUCCESS',
          connector: connectorData?.data?.connector
        }
        setSelectedValue(value)
        props?.onLoadingFinish?.()
      } else if (error) {
        setSelectedValue('')
        props?.onLoadingFinish?.()
      }
    } else {
      // enabling for expressions/runtime
      !loading && props?.onLoadingFinish?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])
  const { getString } = useStrings()

  function onConnectorCreateSuccess(data?: ConnectorConfigDTO): void {
    if (data) {
      props?.onLoadingFinish?.()
      setIsConnectorEdited(true)
      const scope = getScopeFromDTO<ConnectorConfigDTO>(data.connector)
      const val = {
        label: data.connector.name,
        value:
          scope === Scope.ORG || scope === Scope.ACCOUNT
            ? `${scope}.${data.connector.identifier}`
            : data.connector.identifier,
        scope,
        connector: data.connector,
        live: data?.status?.status === 'SUCCESS'
      }
      props.onChange?.(val, MultiTypeInputValue.SELECT_OPTION, MultiTypeInputType.FIXED)
      formik?.setFieldValue(name, val.value)
      setSelectedValue(val)
      setInlineSelection({
        selected: true,
        inlineModalClosed: false
      })
    }
  }

  const onModalClose = (): void => {
    setInlineSelection(prevState => {
      return { ...prevState, inlineModalClosed: true }
    })
  }
  const { secretsManager } = useGetSecretsManagerConnectorsHook()

  const { openConnectorModal } = useCreateConnectorModal({
    onSuccess: onConnectorCreateSuccess,
    onClose: onModalClose
  })

  const { openConnectorMultiTypeModal } = useCreateConnectorMultiTypeModal({
    types: isSecretManagerCategory ? secretsManager : Array.isArray(type) ? type : [type],
    onSuccess: onConnectorCreateSuccess,
    onClose: onModalClose
  })

  const placeHolderLocal = loading ? getString('loading') : placeholder
  const isDisabled = loading || disabled

  const optionalReferenceSelectProps: Pick<
    ReferenceSelectProps<ConnectorConfigDTO>,
    'createNewHandler' | 'editRenderer'
  > = {}

  if (typeof type === 'string' && !category) {
    optionalReferenceSelectProps.createNewHandler = () => {
      openConnectorModal(false, type, {
        gitDetails: {
          repoIdentifier: gitScope?.repo,
          branch: gitScope?.branch,
          getDefaultFromOtherRepo: gitScope?.getDefaultFromOtherRepo || true
        }
      })
    }
  } else if (Array.isArray(type) && !category) {
    optionalReferenceSelectProps.createNewHandler = () => {
      openConnectorMultiTypeModal()
    }
  } else if (isSecretManagerCategory) {
    optionalReferenceSelectProps.createNewHandler = () => {
      openConnectorMultiTypeModal()
    }
  }

  if (typeof type === 'string' && typeof selectedValue === 'object') {
    optionalReferenceSelectProps.editRenderer = getEditRenderer(
      selectedValue,
      openConnectorModal,
      selectedValue?.connector?.type || type,
      getString,
      { accountIdentifier, projectIdentifier, orgIdentifier }
    )
  } else if (Array.isArray(type) && typeof selectedValue === 'object') {
    optionalReferenceSelectProps.editRenderer = getEditRenderer(
      selectedValue,
      openConnectorModal,
      selectedValue?.connector?.type,
      getString,
      { accountIdentifier, projectIdentifier, orgIdentifier }
    )
  }

  const [openDrawer, hideDrawer] = useModalHook(() => {
    const onSelect = (val: ItemInterface): void => {
      openConnectorModal(false, val?.value as ConnectorInfoDTO['type'], undefined)
      hideDrawer()
    }

    return <AddConnectorsDrawer onSelect={onSelect} onClose={hideDrawer} />
  }, [])

  const [pagedConnectorData, setPagedConnectorData] = useState<ResponsePageConnectorResponse>({})
  const [page, setPage] = useState(0)

  const connectorIdentifiers = useMemo(() => {
    if (!templateProps?.isTemplatizedView || !templateProps.templateValue) return

    const input =
      typeof templateProps.templateValue === 'string' ? templateProps.templateValue : templateProps.templateValue.value

    if (typeof input !== 'string') return

    return parseInput(input)?.[InputSetFunction.ALLOWED_VALUES]?.values?.map(getIdentifierFromValue)
  }, [templateProps?.isTemplatizedView, templateProps?.templateValue])

  const getReferenceFieldPropsValues = getReferenceFieldProps({
    defaultScope,
    gitScope,
    accountIdentifier,
    projectIdentifier,
    orgIdentifier,
    type,
    category,
    name,
    selected,
    width,
    placeholder: placeHolderLocal,
    label,
    ...(Array.isArray(connectorIdentifiers) && {
      connectorFilterProperties: {
        connectorIdentifiers,
        types: Array.isArray(type) ? type : [type]
      }
    }),
    getString,
    openConnectorModal,
    setPagedConnectorData,
    renderRecordDisabledWarning,
    version,
    isFavoritesEnabled: PL_FAVORITES
  })

  const defaultItemRenderer: ItemRenderer<SelectOption> = (item, renderProps): JSX.Element | null => {
    if (item.value === Connectors.Harness) {
      return (
        <li
          className={css.gitProviderListItem}
          key={item.value.toString()}
          onClick={e => {
            renderProps.handleClick(e)
          }}
        >
          {item.label}
        </li>
      )
    } else {
      return (
        <li className={css.gitProviderListItem} key={item.value.toString()}>
          <MultiTypeReferenceInput<ConnectorReferenceDTO>
            name={name}
            disabled={isDisabled}
            referenceSelectProps={{
              ...getReferenceFieldPropsValues,
              // Only Github will have collapse view and not others.
              // Other connectors will need to onboard this and add details in collapsed view.
              // Please update the details in RenderConnectorDetails inside ConnectorReferenceField.
              disableCollapse: !(type === 'Github'),
              showAllTab: true,
              pagination: {
                itemCount: pagedConnectorData?.data?.totalItems || 0,
                pageSize: pagedConnectorData?.data?.pageSize || 10,
                pageCount: pagedConnectorData?.data?.totalPages || -1,
                pageIndex: page || 0,
                gotoPage: pageIndex => setPage(pageIndex)
              },
              sortProps: {
                selectedSortMethod: sortPreference,
                onSortMethodChange: option => {
                  setSortPreference(option.value as SortMethod)
                },
                sortOptions: [...sortByLastModified, ...sortByCreated, ...sortByName]
              },
              isNewConnectorLabelVisible: canUpdate && isNewConnectorLabelVisible,
              selectedRenderer: getSelectedRenderer(selectedValue, !!connectorStatus, connectorStatusCheckInProgress),
              selectedRecord: selectedValue,
              ...optionalReferenceSelectProps,
              disabled: isDisabled,
              hideModal: inlineSelection.selected && inlineSelection.inlineModalClosed,
              createNewLabel: createNewLabel || getString('newConnector'),
              enableFavorite: true,
              createNewBtnComponent: (
                <RbacButton
                  variation={ButtonVariation.SECONDARY}
                  onClick={() => {
                    isDrawerMode ? openDrawer() : optionalReferenceSelectProps.createNewHandler?.()
                  }}
                  text={`+ ${createNewLabel || getString('newConnector')}`}
                  margin={{ right: 'small' }}
                  permission={{
                    permission: PermissionIdentifier.UPDATE_CONNECTOR,
                    resource: {
                      resourceType: ResourceType.CONNECTOR
                    },
                    resourceScope: { accountIdentifier, orgIdentifier, projectIdentifier }
                  }}
                ></RbacButton>
              ),
              isOnlyFixedtype: true
            }}
            onChange={(val, valueType, type1) => {
              if (val && type1 === MultiTypeInputType.FIXED) {
                const { record, scope } = val as unknown as { record: ConnectorReferenceDTO; scope: Scope }
                const value = {
                  label: record.name,
                  value:
                    scope === Scope.ORG || scope === Scope.ACCOUNT
                      ? `${scope}.${record.identifier}`
                      : record.identifier,
                  scope,
                  live: record?.status?.status === 'SUCCESS',
                  connector: record
                }
                setSelectedValue(value)
                formik?.setValues(
                  produce(formik?.values, (draft: any) => {
                    set(draft, name, value.value)
                    set(draft, 'provider', {
                      label: getString('stepPalette.others'),
                      value: getString('stepPalette.others')
                    })
                  })
                )
              }
              props?.onLoadingFinish?.()
              onChange?.(val, valueType, type1)
              setMultiType(type1)
            }}
            value={selectedValue}
            multitypeInputValue={multitypeInputValue}
            {...multiTypeProps}
            useGitProviderComponent
          />
        </li>
      )
    }
  }

  const component = (
    <FormGroup {...rest} labelFor={name} helperText={helperText} intent={intent} style={{ marginBottom: 0 }}>
      <Container width={width}>
        <FormInput.MultiTypeInput
          name="provider"
          selectItems={GitProviderOptions(getString)}
          multiTypeInputProps={{
            onChange: (value: any, _typeValue, _type) => {
              if (_type === MultiTypeInputType.FIXED) {
                if (!value || value?.value === Connectors.Harness) {
                  setSelectedValue('')
                  get(formik?.values, name) && formik?.setFieldValue(name, '')
                  onChange?.('', _typeValue, _type)
                }
              } else {
                formik?.setFieldValue(name, value || '')
                setSelectedValue(value || '')
                onChange?.(value, _typeValue, _type)
              }
              setMultiType(_type)
            },
            selectProps: {
              items: GitProviderOptions(getString),
              itemRenderer: defaultItemRenderer,
              addClearBtn: false
            },
            ...multiTypeProps
          }}
          label={getString('common.gitProvider')}
          tooltipProps={{ dataTooltipId: dataTooltipId }}
          disabled={disabled}
        />
      </Container>
    </FormGroup>
  )

  return (
    <div
      style={style}
      className={cx(css.connectorLabel, connectorLabelClassFromProps, {
        [css.mini]: mini
      })}
    >
      {enableConfigureOptions ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {component}
          {getMultiTypeFromValue(selected) === MultiTypeInputType.RUNTIME && (
            <ConnectorConfigureOptions
              value={selected}
              type={getString('string')}
              variableName={name}
              showRequiredField={false}
              showDefaultField={false}
              onChange={val => {
                formik?.setFieldValue(name, val)
                onChange?.(val, MultiTypeInputValue.STRING, MultiTypeInputType.RUNTIME)
              }}
              {...configureOptionsProps}
              isReadonly={props.disabled}
              connectorReferenceFieldProps={{
                accountIdentifier,
                projectIdentifier,
                orgIdentifier,
                type,
                label,
                disabled,
                gitScope,
                category,
                tooltipProps: { dataTooltipId },
                renderRecordDisabledWarning
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

export const FormMultiTypeGitProviderAndConnectorField = connect(MultiTypeGitProviderAndConnectorField)