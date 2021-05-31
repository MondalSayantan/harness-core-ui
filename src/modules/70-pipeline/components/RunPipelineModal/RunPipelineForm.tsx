import React, { useEffect, useRef } from 'react'
import { Tooltip, Intent, Dialog, Classes, RadioGroup, Radio, PopoverPosition } from '@blueprintjs/core'
import {
  Button,
  Checkbox,
  Formik,
  FormikForm,
  Layout,
  Text,
  NestedAccordionProvider,
  Icon,
  useModalHook,
  Utils,
  Heading,
  Color
} from '@wings-software/uicore'
import cx from 'classnames'
import { useHistory } from 'react-router-dom'
import { parse, stringify } from 'yaml'
import { pick, merge, isEmpty, debounce } from 'lodash-es'
import type { FormikErrors } from 'formik'
import { PageSpinner } from '@common/components/Page/PageSpinner'
import type { NgPipeline, ResponseJsonNode } from 'services/cd-ng'
import {
  useGetPipeline,
  usePostPipelineExecuteWithInputSetYaml,
  useGetTemplateFromPipeline,
  useGetMergeInputSetFromPipelineTemplateWithListInput,
  getInputSetForPipelinePromise,
  useGetInputSetsListForPipeline
} from 'services/pipeline-ng'
import { useToaster } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { PipelineInputSetForm } from '@pipeline/components/PipelineInputSetForm/PipelineInputSetForm'
import type { GitQueryParams, InputSetGitQueryParams, PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { PageBody } from '@common/components/Page/PageBody'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import type { InputSetDTO } from '../InputSetForm/InputSetForm'
import { InputSetSelector, InputSetSelectorProps } from '../InputSetSelector/InputSetSelector'
import { clearRuntimeInput, validatePipeline, getErrorsList } from '../PipelineStudio/StepUtil'
import { PreFlightCheckModal } from '../PreFlightCheckModal/PreFlightCheckModal'
import css from './RunPipelineModal.module.scss'

export const POLL_INTERVAL = 1 /* sec */ * 1000 /* ms */
const debouncedValidatePipeline = debounce(validatePipeline, 300)
export interface RunPipelineFormProps extends PipelineType<PipelinePathProps & GitQueryParams> {
  inputSetSelected?: InputSetSelectorProps['value']
  inputSetYAML?: string
  onClose?: () => void
  executionView?: boolean
  mockData?: ResponseJsonNode
}

function RunPipelineFormBasic({
  pipelineIdentifier,
  accountId,
  orgIdentifier,
  projectIdentifier,
  onClose,
  inputSetSelected,
  inputSetYAML,
  module,
  executionView,
  branch,
  repoIdentifier,
  inputSetRepoIdentifier,
  inputSetBranch
}: RunPipelineFormProps & InputSetGitQueryParams): React.ReactElement {
  const [skipPreFlightCheck, setSkipPreFlightCheck] = React.useState<boolean>(false)
  const [notifyOnlyMe, setNotifyOnlyMe] = React.useState<boolean>(false)
  const [selectedInputSets, setSelectedInputSets] = React.useState<InputSetSelectorProps['value']>(inputSetSelected)
  const [formErrors, setFormErrors] = React.useState<FormikErrors<InputSetDTO>>({})
  const [currentPipeline, setCurrentPipeline] = React.useState<{ pipeline?: NgPipeline } | undefined>(
    inputSetYAML ? parse(inputSetYAML) : undefined
  )
  const [gitFilter, setGitFilter] = React.useState<GitFilterScope | null>({
    repo: inputSetRepoIdentifier || '',
    branch: inputSetBranch || ''
  })
  const { showError, showSuccess, showWarning } = useToaster()
  const history = useHistory()
  const { getString } = useStrings()
  const { isGitSyncEnabled } = useAppStore()

  useEffect(() => {
    if (inputSetYAML) {
      setExistingProvide('provide')
      setCurrentPipeline(parse(inputSetYAML))
    }
  }, [inputSetYAML])

  const { data: template, loading: loadingTemplate } = useGetTemplateFromPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    }
  })
  const { data: pipelineResponse, loading: loadingPipeline } = useGetPipeline({
    pipelineIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    }
  })
  const { mutate: runPipeline, loading: runLoading } = usePostPipelineExecuteWithInputSetYaml({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      repoIdentifier,
      branch
    },
    identifier: pipelineIdentifier,
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const { data: inputSetResponse, loading: inputSetLoading } = useGetInputSetsListForPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      repoIdentifier,
      branch
    }
  })

  const inputSets = inputSetResponse?.data?.content

  const yamlTemplate = React.useMemo(() => {
    return parse(template?.data?.inputSetTemplateYaml || '')?.pipeline
  }, [template?.data?.inputSetTemplateYaml])

  React.useEffect(() => {
    setCurrentPipeline(
      merge(parse(template?.data?.inputSetTemplateYaml || ''), currentPipeline || {}) as { pipeline: NgPipeline }
    )
  }, [template?.data?.inputSetTemplateYaml])

  React.useEffect(() => {
    setSelectedInputSets(inputSetSelected)
  }, [inputSetSelected])

  React.useEffect(() => {
    if (template?.data?.inputSetTemplateYaml) {
      if ((selectedInputSets && selectedInputSets.length > 1) || selectedInputSets?.[0]?.type === 'OVERLAY_INPUT_SET') {
        const fetchData = async (): Promise<void> => {
          try {
            const data = await mergeInputSet({
              inputSetReferences: selectedInputSets.map(item => item.value as string)
            })
            if (data?.data?.pipelineYaml) {
              setCurrentPipeline(parse(data.data.pipelineYaml) as { pipeline: NgPipeline })
            }
          } catch (e) {
            showError(e?.data?.message || e?.message)
          }
        }
        fetchData()
      } else if (selectedInputSets && selectedInputSets.length === 1) {
        const fetchData = async (): Promise<void> => {
          const data = await getInputSetForPipelinePromise({
            inputSetIdentifier: selectedInputSets[0].value as string,
            queryParams: {
              accountIdentifier: accountId,
              projectIdentifier,
              orgIdentifier,
              pipelineIdentifier,
              repoIdentifier: selectedInputSets[0]?.gitDetails?.repoIdentifier,
              branch: selectedInputSets[0]?.gitDetails?.branch
            }
          })
          if (data?.data?.inputSetYaml) {
            if (selectedInputSets[0].type === 'INPUT_SET') {
              setCurrentPipeline(pick(parse(data.data.inputSetYaml)?.inputSet, 'pipeline') as { pipeline: NgPipeline })
            }
          }
        }
        fetchData()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    template?.data?.inputSetTemplateYaml,
    selectedInputSets,
    accountId,
    projectIdentifier,
    orgIdentifier,
    pipelineIdentifier
  ])

  const { mutate: mergeInputSet, loading: loadingUpdate } = useGetMergeInputSetFromPipelineTemplateWithListInput({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      pipelineIdentifier,
      pipelineRepoID: repoIdentifier,
      pipelineBranch: branch,
      ...(gitFilter?.repo &&
        gitFilter.branch && {
          repoIdentifier: gitFilter.repo,
          branch: gitFilter.branch,
          getDefaultFromOtherRepo: true
        })
    }
  })

  const pipeline: NgPipeline | undefined = parse(pipelineResponse?.data?.yamlPipeline || '')?.pipeline
  const renderErrors = React.useCallback(() => {
    const errorList = getErrorsList(formErrors)
    const errorCount = errorList.length
    if (!errorCount) {
      return null
    }
    const errorString = `Errors: ${errorCount}`
    return (
      <Layout.Horizontal spacing="small" className={css.errorHeader}>
        <Icon name="warning-sign" intent={Intent.DANGER} />
        <Text intent="danger">{errorString}</Text>
        <Utils.WrapOptionalTooltip
          tooltip={
            <div className={css.runPipelineErrorDesc}>
              {errorList.map((errorMessage, index) => (
                <Text intent="danger" key={index} font={{ weight: 'semi-bold' }} className={css.runPipelineErrorLine}>
                  {errorMessage}
                </Text>
              ))}
            </div>
          }
          tooltipProps={{
            position: PopoverPosition.BOTTOM,
            inheritDarkTheme: true,
            popoverClassName: css.runPipelineErrorPopover
          }}
        >
          <Text font={{ size: 'small' }}>See details</Text>
        </Utils.WrapOptionalTooltip>
      </Layout.Horizontal>
    )
  }, [formErrors])

  const valuesPipelineRef = useRef<NgPipeline>()

  const [showPreflightCheckModal, hidePreflightCheckModal] = useModalHook(() => {
    return (
      <Dialog className={cx(css.preFlightCheckModal, Classes.DIALOG)} isOpen onClose={hidePreflightCheckModal}>
        <PreFlightCheckModal
          pipeline={valuesPipelineRef.current}
          module={module}
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
          pipelineIdentifier={pipelineIdentifier}
          branch={branch}
          repoIdentifier={repoIdentifier}
          onCloseButtonClick={hidePreflightCheckModal}
          onContinuePipelineClick={() => {
            hidePreflightCheckModal()
            handleRunPipeline(valuesPipelineRef.current, true)
          }}
        />
      </Dialog>
    )
  }, [])

  const handleRunPipeline = React.useCallback(
    async (valuesPipeline?: NgPipeline, forceSkipFlightCheck = false) => {
      valuesPipelineRef.current = valuesPipeline
      if (!skipPreFlightCheck && !forceSkipFlightCheck) {
        // Not skipping pre-flight check - open the new modal
        showPreflightCheckModal()
        return
      }

      try {
        const response = await runPipeline(
          !isEmpty(valuesPipelineRef.current) ? (stringify({ pipeline: valuesPipelineRef.current }) as any) : ''
        )
        const data = response.data
        if (response.status === 'SUCCESS') {
          if (response.data) {
            showSuccess(getString('runPipelineForm.pipelineRunSuccessFully'))
            history.push(
              routes.toExecutionPipelineView({
                orgIdentifier,
                pipelineIdentifier,
                projectIdentifier,
                executionIdentifier: data?.planExecution?.uuid || '',
                accountId,
                module
              })
            )
          }
        }
      } catch (error) {
        showWarning(error?.data?.message || getString('runPipelineForm.runPipelineFailed'))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      runPipeline,
      showWarning,
      showSuccess,
      pipelineIdentifier,
      history,
      orgIdentifier,
      module,
      projectIdentifier,
      onClose,
      accountId,
      skipPreFlightCheck
    ]
  )

  const [existingProvide, setExistingProvide] = React.useState('existing')

  useEffect(() => {
    if (inputSets && !(inputSets.length > 0)) {
      setExistingProvide('provide')
    }
  }, [inputSets])

  const mountRefForError = React.useRef<boolean>(false)

  React.useEffect(() => {
    if (mountRefForError.current && selectedInputSets) {
      mountRefForError.current = false
    }
  }, [selectedInputSets])

  React.useEffect(() => {
    let errors: FormikErrors<InputSetDTO> = formErrors

    if (
      !mountRefForError.current &&
      currentPipeline?.pipeline &&
      template?.data?.inputSetTemplateYaml &&
      yamlTemplate &&
      pipeline
    ) {
      errors = validatePipeline(
        selectedInputSets && selectedInputSets.length > 0
          ? currentPipeline.pipeline
          : { ...clearRuntimeInput(currentPipeline.pipeline) },
        parse(template?.data?.inputSetTemplateYaml || '').pipeline,
        currentPipeline.pipeline,
        getString
      ) as any
      mountRefForError.current = true
      setFormErrors(errors)
    }
  }, [
    existingProvide,
    currentPipeline,
    getString,
    pipeline,
    template?.data?.inputSetTemplateYaml,
    yamlTemplate,
    selectedInputSets,
    existingProvide
  ])

  if (loadingPipeline || loadingTemplate || loadingUpdate || runLoading || inputSetLoading) {
    return <PageSpinner />
  }

  const child = (
    <>
      <Formik
        initialValues={
          pipeline && currentPipeline && template?.data?.inputSetTemplateYaml
            ? currentPipeline?.pipeline
              ? clearRuntimeInput(currentPipeline.pipeline)
              : {}
            : currentPipeline?.pipeline
            ? clearRuntimeInput(currentPipeline.pipeline)
            : {}
        }
        formName="runPipeline"
        onSubmit={values => {
          handleRunPipeline(values as any)
        }}
        enableReinitialize
        validate={values => {
          let errors: FormikErrors<InputSetDTO> = formErrors

          setCurrentPipeline({ ...currentPipeline, pipeline: values as NgPipeline })
          if (values && yamlTemplate && pipeline) {
            errors =
              (debouncedValidatePipeline(
                values as NgPipeline,
                parse(template?.data?.inputSetTemplateYaml || '').pipeline,
                pipeline,
                getString
              ) as any) || formErrors
          }
          if (typeof errors !== undefined) setFormErrors(errors)
          return errors
        }}
      >
        {({ submitForm }) => {
          return (
            <>
              <Layout.Vertical>
                {executionView ? null : (
                  <>
                    <div className={css.runModalHeader}>
                      <Heading
                        level={2}
                        font={{ weight: 'bold' }}
                        color={Color.BLACK_100}
                        className={css.runModalHeaderTitle}
                      >
                        {getString('runPipeline')}
                      </Heading>
                    </div>
                    {renderErrors()}
                  </>
                )}
                <div className={css.runModalFormContent}>
                  <FormikForm>
                    {pipeline && currentPipeline && template?.data?.inputSetTemplateYaml ? (
                      <>
                        {inputSets && inputSets.length > 0 && (
                          <>
                            {!executionView && (
                              <Layout.Vertical
                                className={css.pipelineHeader}
                                padding={{ top: 'xlarge', left: 'xlarge', right: 'xlarge' }}
                              >
                                <div>
                                  <Layout.Horizontal className={css.runModalSubHeading} id="use-input-set">
                                    <RadioGroup
                                      name="existingProvideRadio"
                                      label={getString(
                                        'pipeline.triggers.pipelineInputPanel.selectedExisitingOrProvide'
                                      )}
                                      inline
                                      selectedValue={existingProvide}
                                      onChange={ev => {
                                        setExistingProvide((ev.target as HTMLInputElement).value)
                                      }}
                                    >
                                      <Radio
                                        label={getString('pipeline.triggers.pipelineInputPanel.provide')}
                                        value="provide"
                                        className={cx(
                                          css.valueProviderRadio,
                                          existingProvide === 'provide' ? css.selectedValueProvider : ''
                                        )}
                                      />
                                      <Radio
                                        label={getString('pipeline.triggers.pipelineInputPanel.existing')}
                                        value="existing"
                                        className={cx(
                                          css.valueProviderRadio,
                                          existingProvide === 'existing' ? css.selectedValueProvider : ''
                                        )}
                                      />
                                    </RadioGroup>
                                    <span className={css.helpSection}>
                                      <Icon name="question" className={css.helpIcon} />
                                      <Text
                                        tooltipProps={{
                                          position: PopoverPosition.BOTTOM
                                        }}
                                        tooltip={
                                          <Text padding="medium" width={400}>
                                            Harness Input Sets are collections of variables/values that can be provided
                                            to one or more Pipelines before execution.
                                            <a
                                              href="https://ngdocs.harness.io/article/3fqwa8et3d-input-sets"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              Learn more
                                            </a>
                                          </Text>
                                        }
                                      >
                                        {getString('pipeline.triggers.pipelineInputPanel.whatAreInputsets')}
                                      </Text>
                                    </span>
                                  </Layout.Horizontal>
                                  {isGitSyncEnabled && (
                                    <div className={css.gitFilters}>
                                      <GitSyncStoreProvider>
                                        <GitFilters
                                          onChange={filter => {
                                            setGitFilter(filter)
                                          }}
                                          defaultValue={gitFilter || undefined}
                                        />
                                      </GitSyncStoreProvider>
                                    </div>
                                  )}
                                </div>
                                {!executionView &&
                                  pipeline &&
                                  currentPipeline &&
                                  template?.data?.inputSetTemplateYaml &&
                                  existingProvide === 'existing' && (
                                    <InputSetSelector
                                      pipelineIdentifier={pipelineIdentifier}
                                      onChange={inputsets => {
                                        setSelectedInputSets(inputsets)
                                      }}
                                      value={selectedInputSets}
                                      gitFilter={gitFilter || undefined}
                                    />
                                  )}
                              </Layout.Vertical>
                            )}
                          </>
                        )}
                        {(existingProvide === 'provide' ||
                          (selectedInputSets && selectedInputSets?.length > 0) ||
                          executionView) && (
                          <PipelineInputSetForm
                            originalPipeline={pipeline}
                            template={parse(template.data.inputSetTemplateYaml).pipeline}
                            readonly={executionView}
                            path=""
                          />
                        )}
                        {existingProvide === 'existing' && selectedInputSets && selectedInputSets?.length > 0 && (
                          <div className={css.noPipelineInputSetForm} />
                        )}
                      </>
                    ) : (
                      <Layout.Horizontal padding="medium" margin="medium">
                        <Text>{getString('runPipelineForm.noRuntimeInput')}</Text>
                      </Layout.Horizontal>
                    )}
                  </FormikForm>
                </div>
                {executionView ? null : (
                  <Layout.Horizontal padding={{ left: 'xlarge', right: 'xlarge', top: 'medium', bottom: 'medium' }}>
                    <Checkbox
                      label={getString('pre-flight-check.skipCheckBtn')}
                      background={Color.GREY_200}
                      className={css.footerCheckbox}
                      padding={{ top: 'small', bottom: 'small', left: 'xxlarge', right: 'medium' }}
                      checked={skipPreFlightCheck}
                      onChange={e => setSkipPreFlightCheck(e.currentTarget.checked)}
                    />
                    <Tooltip position="top" content={getString('featureNA')}>
                      <Checkbox
                        background={Color.PRIMARY_2}
                        color={Color.BLUE_500}
                        className={css.footerCheckbox}
                        margin={{ left: 'medium' }}
                        padding={{ top: 'small', bottom: 'small', left: 'xxlarge', right: 'medium' }}
                        disabled
                        label={getString('runPipelineForm.notifyOnlyMe')}
                        checked={notifyOnlyMe}
                        onChange={e => setNotifyOnlyMe(e.currentTarget.checked)}
                      />
                    </Tooltip>
                  </Layout.Horizontal>
                )}
                {executionView ? null : (
                  <Layout.Horizontal
                    className={cx(css.footer, css.actionButtons)}
                    padding={{ left: 'xlarge', right: 'xlarge', top: 'medium', bottom: 'medium' }}
                  >
                    <RbacButton
                      style={{ backgroundColor: 'var(--green-600' }}
                      intent="primary"
                      type="submit"
                      text={getString('runPipeline')}
                      onClick={event => {
                        event.stopPropagation()
                        if ((!selectedInputSets || selectedInputSets.length === 0) && existingProvide === 'existing') {
                          setExistingProvide('provide')
                        } else {
                          submitForm()
                        }
                      }}
                      permission={{
                        resource: {
                          resourceIdentifier: pipeline?.identifier as string,
                          resourceType: ResourceType.PIPELINE
                        },
                        permission: PermissionIdentifier.EXECUTE_PIPELINE
                      }}
                      disabled={getErrorsList(formErrors).length > 0}
                    />
                    <div className={css.secondaryButton}>
                      <Button
                        id="cancel-runpipeline"
                        text={getString('cancel')}
                        margin={{ left: 'medium' }}
                        background={Color.GREY_50}
                        onClick={() => {
                          if (onClose) {
                            onClose()
                          } else {
                            history.goBack()
                          }
                        }}
                      />
                    </div>
                  </Layout.Horizontal>
                )}
              </Layout.Vertical>
            </>
          )
        }}
      </Formik>
    </>
  )

  return executionView ? (
    <div className={css.runFormExecutionView}>{child}</div>
  ) : (
    <RunPipelineFormWrapper
      accountId={accountId}
      orgIdentifier={orgIdentifier}
      pipelineIdentifier={pipelineIdentifier}
      projectIdentifier={projectIdentifier}
      module={module}
      pipeline={pipeline}
    >
      {child}
    </RunPipelineFormWrapper>
  )
}

export interface RunPipelineFormWrapperProps extends PipelineType<PipelinePathProps> {
  children: React.ReactNode
  pipeline?: NgPipeline
}

export function RunPipelineFormWrapper(props: RunPipelineFormWrapperProps): React.ReactElement {
  const { children } = props

  return (
    <React.Fragment>
      <PageBody className={css.runForm}>{children}</PageBody>
    </React.Fragment>
  )
}

export const RunPipelineForm: React.FC<RunPipelineFormProps & InputSetGitQueryParams> = props => {
  return (
    <NestedAccordionProvider>
      <RunPipelineFormBasic {...props} />
    </NestedAccordionProvider>
  )
}
