/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, set, get, isEmpty, isArray } from 'lodash-es'
import { parse } from 'yaml'
import type { FormikErrors } from 'formik'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'

import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import {
  ServiceSpec,
  getConnectorListV2Promise,
  getBuildDetailsForArtifactoryArtifactWithYamlPromise,
  ResponsePageConnectorResponse,
  ConnectorResponse,
  getBuildDetailsForDockerPromise,
  getBuildDetailsForEcrPromise,
  getBuildDetailsForNexusArtifactPromise,
  ResponseArtifactoryResponseDTO,
  ArtifactoryBuildDetailsDTO
} from 'services/cd-ng'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import {
  ArtifactToConnectorMap,
  allowedArtifactTypes,
  ENABLED_ARTIFACT_TYPES
} from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import {
  StepViewType,
  ValidateInputSetProps,
  Step,
  StepProps,
  InputSetData
} from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { ArtifactType } from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import type { K8SDirectServiceStep } from '@pipeline/factories/ArtifactTriggerInputFactory/types'
import { isTemplatizedView } from '@pipeline/utils/stepUtils'
import { getConnectorName, getConnectorValue } from '@triggers/pages/triggers/utils/TriggersWizardPageUtils'
import {
  GenericServiceSpecVariablesForm,
  K8sServiceSpecVariablesFormProps
} from '../Common/GenericServiceSpec/GenericServiceSpecVariablesForm'
import { GenericServiceSpecInputSetMode } from '../Common/GenericServiceSpec/GenericServiceSpecInputSetMode'
import type { ValidateArtifactInputSetFieldArgs, ValidateInputSetFieldArgs } from '../Common/types'
import {
  validateCustomArtifactFields,
  validateArtifactoryArtifactFields,
  validateACRArtifactFields,
  validateNexus3ArtifactFields,
  validateCommonArtifactFields,
  validateAmazonS3ArtifactFields,
  validateECRArtifactFields,
  validateGCRArtifactFields
} from '../Common/utils/runtimeViewValidation'
import { ASGServiceSpecEditable } from './ASGServiceSpecEditable'

const logger = loggerFor(ModuleName.CD)

const ManifestConnectorRefRegex = /^.+manifest\.spec\.store\.spec\.connectorRef$/
const ManifestConnectorRefType = 'Git'
const ArtifactsPrimaryRegex = /^.+artifacts\.primary\.spec\.connectorRef$/
const ArtifactsPrimaryTagRegex = /^.+artifacts\.primary\.spec\.artifactPath$/

const ecsAllowedArtifactTypes: Array<ArtifactType> = allowedArtifactTypes.ECS

export class ASGServiceSpec extends Step<ServiceSpec> {
  protected type = StepType.Asg
  protected defaultValues: ServiceSpec = {}
  protected inputSetData: InputSetData<K8SDirectServiceStep> | undefined = undefined
  protected referenceId = 'AsgService'

  protected stepIcon: IconName = 'aws-asg'
  protected stepName = 'Deployment Service'
  protected stepPaletteVisible = false
  protected _hasStepVariables = true
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.invocationMap.set(ArtifactsPrimaryRegex, this.getArtifactsPrimaryConnectorsListForYaml.bind(this))
    this.invocationMap.set(ManifestConnectorRefRegex, this.getManifestConnectorsListForYaml.bind(this))
    this.invocationMap.set(ArtifactsPrimaryTagRegex, this.getArtifactsTagsListForYaml.bind(this))
  }

  protected returnConnectorListFromResponse(response: ResponsePageConnectorResponse): CompletionItemInterface[] {
    return (
      response?.data?.content?.map((connector: ConnectorResponse) => ({
        label: getConnectorName(connector),
        insertText: getConnectorValue(connector),
        kind: CompletionItemKind.Field
      })) || []
    )
  }

  protected getManifestConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }

    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj?.type === ManifestConnectorRefType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: ['Git', 'Github', 'Gitlab', 'Bitbucket'], filterType: 'Connector' }
        }).then(this.returnConnectorListFromResponse)
      }
    }

    return Promise.resolve([])
  }

  protected getArtifactsPrimaryConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (ecsAllowedArtifactTypes.includes(obj?.type)) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: {
            types: [
              ArtifactToConnectorMap.Jenkins,
              ArtifactToConnectorMap.ArtifactoryRegistry,
              ArtifactToConnectorMap.DockerRegistry,
              ArtifactToConnectorMap.Ecr,
              ArtifactToConnectorMap.Nexus3Registry
            ],
            filterType: 'Connector'
          }
        }).then(this.returnConnectorListFromResponse)
      }
    }

    return Promise.resolve([])
  }

  trasformTagData(response: ResponseArtifactoryResponseDTO): CompletionItemInterface[] {
    const data = response?.data?.buildDetailsList?.map((buildDetails: ArtifactoryBuildDetailsDTO) => ({
      label: defaultTo(buildDetails.tag, ''),
      insertText: defaultTo(buildDetails.tag, ''),
      kind: CompletionItemKind.Field
    }))
    return defaultTo(data, [])
  }

  protected getArtifactsTagsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }

    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }

    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.tag', ''))
      if (ecsAllowedArtifactTypes.includes(obj?.type)) {
        switch (obj.type) {
          case ENABLED_ARTIFACT_TYPES.ArtifactoryRegistry: {
            return getBuildDetailsForArtifactoryArtifactWithYamlPromise({
              queryParams: {
                artifactPath: obj.spec?.artifactPath,
                repository: obj.spec?.repository,
                repositoryFormat: 'docker',
                connectorRef: obj.spec?.connectorRef,
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier,
                pipelineIdentifier: pipelineObj.identifier,
                fqnPath: path
              },
              body: yamlStringify(pipelineObj)
            }).then(response => this.trasformTagData(response))
          }
          case ENABLED_ARTIFACT_TYPES.DockerRegistry: {
            return getBuildDetailsForDockerPromise({
              queryParams: {
                imagePath: obj.spec?.imagePath,
                connectorRef: obj.spec?.connectorRef,
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              }
            }).then(response => this.trasformTagData(response))
          }
          case ENABLED_ARTIFACT_TYPES.Ecr: {
            return getBuildDetailsForEcrPromise({
              queryParams: {
                imagePath: obj.spec?.imagePath,
                region: obj.spec?.region,
                connectorRef: obj.spec?.connectorRef,
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              }
            }).then(response => this.trasformTagData(response))
          }
          case ENABLED_ARTIFACT_TYPES.Nexus3Registry: {
            return getBuildDetailsForNexusArtifactPromise({
              queryParams: {
                artifactPath: obj.spec?.artifactPath,
                repository: obj.spec?.repository,
                repositoryFormat: 'docker',
                connectorRef: obj.spec?.connectorRef,
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              }
            }).then(response => this.trasformTagData(response))
          }
        }
      }
    }

    return Promise.resolve([])
  }

  validateManifestInputSetFields({ data, template, isRequired, errors, getString }: ValidateInputSetFieldArgs): void {
    data?.manifests?.forEach((manifest, index) => {
      const currentManifestTemplate = get(template, `manifests[${index}].manifest.spec.store.spec`, '')

      // Git provider manifest store specific fields
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.connectorRef) &&
        isRequired &&
        getMultiTypeFromValue(currentManifestTemplate?.connectorRef) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.connectorRef`,
          getString?.('fieldRequired', { field: getString('connector') })
        )
      }
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.branch) &&
        isRequired &&
        getMultiTypeFromValue(currentManifestTemplate?.branch) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.branch`,
          getString?.('fieldRequired', { field: getString?.('pipelineSteps.deploy.inputSet.branch') })
        )
      }
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.commitId) &&
        isRequired &&
        getMultiTypeFromValue(currentManifestTemplate?.commitId) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.commitId`,
          getString?.('fieldRequired', { field: getString?.('common.commitId') })
        )
      }
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.paths?.[0]) &&
        isRequired &&
        getMultiTypeFromValue(currentManifestTemplate?.paths) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.paths`,
          getString?.('fieldRequired', { field: getString?.('common.fileOrFolderPath') })
        )
      }

      // Harness manifest store spcific fields
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.files?.[0]) &&
        isRequired &&
        getMultiTypeFromValue(currentManifestTemplate?.files) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.files[0]`,
          getString?.('fieldRequired', { field: getString?.('resourcePage.fileStore') })
        )
      }

      // S3 manifest store specific fields
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.region) &&
        isRequired &&
        getMultiTypeFromValue(currentManifestTemplate?.region) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.region`,
          getString?.('fieldRequired', { field: getString?.('regionLabel') })
        )
      }
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.bucketName) &&
        isRequired &&
        getMultiTypeFromValue(currentManifestTemplate?.bucketName) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.bucketName`,
          getString?.('fieldRequired', { field: getString?.('common.bucketName') })
        )
      }
    })
  }

  validateArtifactInputSetFields({
    artifactType,
    data,
    dataPathToField,
    template,
    templatePathToField,
    getString,
    isRequired,
    errors
  }: ValidateArtifactInputSetFieldArgs) {
    /** Most common artifact fields */
    validateCommonArtifactFields({
      data,
      dataPathToField,
      template,
      templatePathToField,
      getString,
      isRequired,
      errors
    })

    // Common fields for Artifactory, Nexus3, ACR
    validateAmazonS3ArtifactFields({
      data,
      dataPathToField,
      template,
      templatePathToField,
      getString,
      isRequired,
      errors
    })

    // Artifactory artifact specific fields
    validateArtifactoryArtifactFields({
      data,
      dataPathToField,
      template,
      templatePathToField,
      getString,
      isRequired,
      errors
    })

    // ECR artifact specific fields
    if (artifactType === ENABLED_ARTIFACT_TYPES.Ecr) {
      validateECRArtifactFields({
        data,
        dataPathToField,
        template,
        templatePathToField,
        getString,
        isRequired,
        errors
      })
    }

    // Nexus3 artifact specific fields
    if (artifactType === ENABLED_ARTIFACT_TYPES.Nexus3Registry) {
      validateNexus3ArtifactFields({
        data,
        dataPathToField,
        template,
        templatePathToField,
        getString,
        isRequired,
        errors
      })
    }
    if (
      isEmpty(get(data, `${dataPathToField}.spec.artifactPath`)) &&
      isRequired &&
      getMultiTypeFromValue(get(template, `${templatePathToField}.spec.artifactPath`)) === MultiTypeInputType.RUNTIME
    ) {
      set(errors, `${dataPathToField}.spec.artifactPath`, getString?.('fieldRequired', { field: 'Artifact Path' }))
    }

    // GCR artifact specific fields
    validateGCRArtifactFields({
      data,
      dataPathToField,
      template,
      templatePathToField,
      getString,
      isRequired,
      errors
    })

    // ACR artifact specific fields
    validateACRArtifactFields({
      data,
      dataPathToField,
      template,
      templatePathToField,
      getString,
      isRequired,
      errors
    })

    // Custom artifact specific fields
    validateCustomArtifactFields({
      data,
      dataPathToField,
      template,
      templatePathToField,
      getString,
      isRequired,
      errors
    })
  }

  validatePrimaryArtifactInputSetFields({
    data,
    template,
    getString,
    isRequired,
    errors
  }: ValidateInputSetFieldArgs): void {
    this.validateArtifactInputSetFields({
      artifactType: data.artifacts?.primary?.type,
      data,
      dataPathToField: 'artifacts.primary.spec',
      template,
      templatePathToField: 'artifacts.primary.spec',
      getString,
      isRequired,
      errors
    })
  }

  validatePrimaryArtifactSourcesInputSetFields({
    data,
    template,
    getString,
    isRequired,
    errors
  }: ValidateInputSetFieldArgs): void {
    if (
      isEmpty(data?.artifacts?.primary?.primaryArtifactRef) &&
      isRequired &&
      getMultiTypeFromValue(template?.artifacts?.primary?.primaryArtifactRef) === MultiTypeInputType.RUNTIME
    ) {
      set(errors, 'artifacts.primary.primaryArtifactRef', getString?.('fieldRequired', { field: 'Primary Artifact' }))
    }
    if (isArray(data?.artifacts?.primary?.sources)) {
      data?.artifacts?.primary?.sources?.forEach((_artifactSource, index) => {
        this.validateArtifactInputSetFields({
          artifactType: data?.artifacts?.primary?.sources?.[index].type,
          data,
          dataPathToField: `artifacts.primary.sources[${index}].spec`,
          template,
          templatePathToField: `artifacts.primary.sources[${index}].spec`,
          getString,
          isRequired,
          errors
        })
      })
    }
  }

  validateSidecarsInputSetFields({ data, template, isRequired, errors, getString }: ValidateInputSetFieldArgs): void {
    data?.artifacts?.sidecars?.forEach((_sidecar, index) => {
      this.validateArtifactInputSetFields({
        artifactType: data?.artifacts?.sidecars?.[index].sidecar?.type,
        data,
        dataPathToField: `artifacts.sidecars[${index}].sidecar.spec`,
        template,
        templatePathToField: `artifacts.sidecars[${index}].sidecar.spec`,
        getString,
        isRequired,
        errors
      })
    })
  }

  validateInputSet({
    data,
    getString,
    viewType
  }: ValidateInputSetProps<K8SDirectServiceStep>): FormikErrors<K8SDirectServiceStep> {
    const errors: FormikErrors<K8SDirectServiceStep> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    const template = this.inputSetData?.template

    /** Manifest fields validation */
    this.validateManifestInputSetFields({
      data,
      template,
      isRequired,
      getString,
      errors
    })

    /** Primary Artifact fields validation */
    this.validatePrimaryArtifactInputSetFields({
      data,
      template,
      getString,
      isRequired,
      errors
    })

    /** Primary Artifact Sources fields validation */
    this.validatePrimaryArtifactSourcesInputSetFields({
      data,
      template,
      getString,
      isRequired,
      errors
    })

    /** Sidecar Artifact fields validation */
    this.validateSidecarsInputSetFields({
      data,
      template,
      getString,
      isRequired,
      errors
    })

    return errors
  }

  renderStep(props: StepProps<K8SDirectServiceStep>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      factory,
      customStepProps,
      readonly,
      allowableTypes,
      viewTypeMetadata
    } = props

    this.inputSetData = inputSetData

    if (stepViewType === StepViewType.InputVariable) {
      return (
        <GenericServiceSpecVariablesForm
          {...(customStepProps as K8sServiceSpecVariablesFormProps)}
          initialValues={initialValues}
          stepsFactory={factory}
          onUpdate={onUpdate}
          readonly={readonly}
        />
      )
    }

    if (isTemplatizedView(stepViewType)) {
      return (
        <GenericServiceSpecInputSetMode
          {...(customStepProps as K8sServiceSpecVariablesFormProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          template={inputSetData?.template}
          path={inputSetData?.path}
          readonly={inputSetData?.readonly || readonly}
          factory={factory}
          allowableTypes={allowableTypes}
          viewTypeMetadata={viewTypeMetadata}
        />
      )
    }

    return (
      <ASGServiceSpecEditable
        {...(customStepProps as K8sServiceSpecVariablesFormProps)}
        factory={factory}
        initialValues={initialValues}
        onUpdate={onUpdate}
        readonly={inputSetData?.readonly || readonly}
      />
    )
  }
}
