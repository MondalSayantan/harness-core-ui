/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export enum FeatureFlag {
  CVNG_ENABLED = 'CVNG_ENABLED',
  CENG_ENABLED = 'CENG_ENABLED',
  CODE_ENABLED = 'CODE_ENABLED',
  SSCA_ENABLED = 'SSCA_ENABLED',
  CET_ENABLED = 'CET_ENABLED',
  NG_DASHBOARDS = 'NG_DASHBOARDS',
  CUSTOM_DASHBOARD_V2 = 'CUSTOM_DASHBOARD_V2',
  CI_TI_DASHBOARDS_ENABLED = 'CI_TI_DASHBOARDS_ENABLED',
  TI_CALLGRAPH = 'TI_CALLGRAPH',
  NG_LICENSES_ENABLED = 'NG_LICENSES_ENABLED',
  FF_GITSYNC = 'FF_GITSYNC',
  FFM_3959_FF_MFE_Environment_Detail = 'FFM_3959_FF_MFE_Environment_Detail',
  FFM_5939_MFE_TARGET_GROUPS_LISTING = 'FFM_5939_MFE_TARGET_GROUPS_LISTING',
  FFM_6666_FF_MFE_Target_Group_Detail = 'FFM_6666_FF_MFE_Target_Group_Detail',
  FFM_5256_FF_MFE_Environment_Listing = 'FFM_5256_FF_MFE_Environment_Listing',
  FFM_5951_FF_MFE_Targets_Listing = 'FFM_5951_FF_MFE_Targets_Listing',
  FFM_6665_FF_MFE_Target_Detail = 'FFM_6665_FF_MFE_Target_Detail',
  FFM_6800_FF_MFE_Onboarding = 'FFM_6800_FF_MFE_Onboarding',
  FFM_7127_FF_MFE_Onboarding_Detail = 'FFM_7127_FF_MFE_Onboarding_Detail',
  FFM_7921_ARCHIVING_FEATURE_FLAGS = 'FFM_7921_ARCHIVING_FEATURE_FLAGS',
  FEATURE_ENFORCEMENT_ENABLED = 'FEATURE_ENFORCEMENT_ENABLED',
  FREE_PLAN_ENFORCEMENT_ENABLED = 'FREE_PLAN_ENFORCEMENT_ENABLED',
  VIEW_USAGE_ENABLED = 'VIEW_USAGE_ENABLED',
  CI_VM_INFRASTRUCTURE = 'CI_VM_INFRASTRUCTURE',
  FFM_1859 = 'FFM_1859', // development only flag for epic https://harness.atlassian.net/browse/FFM-1638,
  DISABLE_HARNESS_SM = 'DISABLE_HARNESS_SM',
  TEST_INTELLIGENCE = 'TEST_INTELLIGENCE',
  CCM_DEV_TEST = 'CCM_DEV_TEST',
  CCM_AS_DRY_RUN = 'CCM_AS_DRY_RUN',
  CCM_SUSTAINABILITY = 'CCM_SUSTAINABILITY',
  NG_FILE_STORE = 'NG_FILE_STORE',
  NG_SVC_ENV_REDESIGN = 'NG_SVC_ENV_REDESIGN',
  CVNG_TEMPLATE_VERIFY_STEP = 'CVNG_TEMPLATE_VERIFY_STEP',
  STALE_FLAGS_FFM_1510 = 'STALE_FLAGS_FFM_1510',
  FFM_3938_STALE_FLAGS_ACTIVE_CARD_HIDE_SHOW = 'FFM_3938_STALE_FLAGS_ACTIVE_CARD_HIDE_SHOW',
  FFM_4117_INTEGRATE_SRM = 'FFM_4117_INTEGRATE_SRM',
  NG_EXECUTION_INPUT = 'NG_EXECUTION_INPUT',
  TI_DOTNET = 'TI_DOTNET',
  CVNG_TEMPLATE_MONITORED_SERVICE = 'CVNG_TEMPLATE_MONITORED_SERVICE',
  ACCOUNT_BASIC_ROLE = 'ACCOUNT_BASIC_ROLE',
  SRM_LICENSE_ENABLED = 'SRM_LICENSE_ENABLED',
  JDK11_UPGRADE_BANNER = 'JDK11_UPGRADE_BANNER',
  CVNG_SPLUNK_METRICS = 'CVNG_SPLUNK_METRICS',
  CCM_MICRO_FRONTEND = 'CCM_MICRO_FRONTEND',
  FFM_2134_FF_PIPELINES_TRIGGER = 'FFM_2134_FF_PIPELINES_TRIGGER',
  CDS_NEXUS_GROUPID_ARTIFACTID_DROPDOWN = 'CDS_NEXUS_GROUPID_ARTIFACTID_DROPDOWN',
  GITOPS_IAM = 'GITOPS_IAM',
  DISABLE_TEMPLATE_SCHEMA_VALIDATION = 'DISABLE_TEMPLATE_SCHEMA_VALIDATION',
  HOSTED_BUILDS = 'HOSTED_BUILDS',
  CCM_COMMORCH = 'CCM_COMMORCH',
  CD_TRIGGERS_REFACTOR = 'CD_TRIGGERS_REFACTOR',
  CD_GIT_WEBHOOK_POLLING = 'CD_GIT_WEBHOOK_POLLING',
  CIE_HOSTED_VMS = 'CIE_HOSTED_VMS',
  ALLOW_USER_TYPE_FIELDS_JIRA = 'ALLOW_USER_TYPE_FIELDS_JIRA',
  AUTO_FREE_MODULE_LICENSE = 'AUTO_FREE_MODULE_LICENSE',
  CREATE_DEFAULT_PROJECT = 'CREATE_DEFAULT_PROJECT',
  AZURE_WEBAPP_NG_S3_ARTIFACTS = 'AZURE_WEBAPP_NG_S3_ARTIFACTS',
  SRM_ET_EXPERIMENTAL = 'SRM_ET_EXPERIMENTAL',
  SRM_ET_RESOLVED_EVENTS = 'SRM_ET_RESOLVED_EVENTS',
  SRM_ET_CRITICAL_EVENTS = 'SRM_ET_CRITICAL_EVENTS',
  SRM_ET_JIRA_INTEGRATION = 'SRM_ET_JIRA_INTEGRATION',
  SRM_CODE_ERROR_NOTIFICATIONS = 'SRM_CODE_ERROR_NOTIFICATIONS',
  CET_EVENTS_CHART = 'CET_EVENTS_CHART',
  CET_CD_INTEGRATION = 'CET_CD_INTEGRATION',
  SRM_ENABLE_VERIFY_STEP_LONG_DURATION = 'SRM_ENABLE_VERIFY_STEP_LONG_DURATION',
  CI_DOCKER_INFRASTRUCTURE = 'CI_DOCKER_INFRASTRUCTURE',
  ENABLE_VERIFY_STEP_LONG_DURATION = 'ENABLE_VERIFY_STEP_LONG_DURATION',
  CI_TESTTAB_NAVIGATION = 'CI_TESTTAB_NAVIGATION',
  TI_MFE_ENABLED = 'TI_MFE_ENABLED',
  SRM_DOWNTIME = 'SRM_DOWNTIME',
  SRM_SLO_ANNOTATIONS = 'SRM_SLO_ANNOTATIONS',
  SRM_CUSTOM_CHANGE_SOURCE = 'SRM_CUSTOM_CHANGE_SOURCE',
  CCM_ENABLE_CLOUD_ASSET_GOVERNANCE_UI = 'CCM_ENABLE_CLOUD_ASSET_GOVERNANCE_UI',
  CCM_CLUSTER_ORCH = 'CCM_CLUSTER_ORCH',
  CCM_MSP = 'CCM_MSP',
  CDS_OrgAccountLevelServiceEnvEnvGroup = 'CDS_OrgAccountLevelServiceEnvEnvGroup',
  LANDING_OVERVIEW_PAGE_V2 = 'LANDING_OVERVIEW_PAGE_V2',
  CCM_CURRENCY_PREFERENCES = 'CCM_CURRENCY_PREFERENCES',
  CVNG_LICENSE_ENFORCEMENT = 'CVNG_LICENSE_ENFORCEMENT',
  CDS_ASG_NG = 'CDS_ASG_NG',
  BAMBOO_ARTIFACT_NG = 'BAMBOO_ARTIFACT_NG',
  CDS_ARTIFACTORY_REPOSITORY_URL_MANDATORY = 'CDS_ARTIFACTORY_REPOSITORY_URL_MANDATORY',
  NG_K8_COMMAND_FLAGS = 'NG_K8_COMMAND_FLAGS',
  IACM_ENABLED = 'IACM_ENABLED',
  CD_NG_DYNAMIC_PROVISIONING_ENV_V2 = 'CD_NG_DYNAMIC_PROVISIONING_ENV_V2',
  CD_TRIGGER_V2 = 'CD_TRIGGER_V2',
  CIE_HOSTED_VMS_WINDOWS = 'CIE_HOSTED_VMS_WINDOWS',
  SPG_MODULE_VERSION_INFO = 'SPG_MODULE_VERSION_INFO',
  PIE_PIPELINE_SETTINGS_ENFORCEMENT_LIMIT = 'PIE_PIPELINE_SETTINGS_ENFORCEMENT_LIMIT',
  CD_NG_DOCKER_ARTIFACT_DIGEST = 'CD_NG_DOCKER_ARTIFACT_DIGEST',
  ENABLE_K8_BUILDS = 'ENABLE_K8_BUILDS',
  CD_TRIGGER_CATALOG_API_ENABLED = 'CD_TRIGGER_CATALOG_API_ENABLED',
  FF_FLAG_SYNC_THROUGH_GITEX_ENABLED = 'FF_FLAG_SYNC_THROUGH_GITEX_ENABLED',
  STO_JIRA_INTEGRATION = 'STO_JIRA_INTEGRATION',
  STO_BASELINE_REGEX = 'STO_BASELINE_REGEX',
  CI_YAML_VERSIONING = 'CI_YAML_VERSIONING',
  CI_REMOTE_DEBUG = 'CI_REMOTE_DEBUG',
  IDP_ENABLED = 'IDP_ENABLED',
  CDC_SERVICE_DASHBOARD_REVAMP_NG = 'CDC_SERVICE_DASHBOARD_REVAMP_NG',
  PL_AUDIT_LOG_STREAMING_ENABLED = 'PL_AUDIT_LOG_STREAMING_ENABLED',
  PL_NEW_PAGE_SIZE = 'PL_NEW_PAGE_SIZE',
  FFM_6683_ALL_ENVIRONMENTS_FLAGS = 'FFM_6683_ALL_ENVIRONMENTS_FLAGS',
  CDS_JIRA_PAT_AUTH = 'CDS_JIRA_PAT_AUTH',
  FFM_4737_JIRA_INTEGRATION = 'FFM_4737_JIRA_INTEGRATION',
  DEL_FETCH_TASK_LOG_API = 'DEL_FETCH_TASK_LOG_API',
  CHAOS_LINUX_ENABLED = 'CHAOS_LINUX_ENABLED',
  CHAOS_PROBE_ENABLED = 'CHAOS_PROBE_ENABLED',
  CHAOS_GAMEDAY_ENABLED = 'CHAOS_GAMEDAY_ENABLED',
  CHAOS_SRM_EVENT = 'CHAOS_SRM_EVENT',
  CDS_V1_EOL_BANNER = 'CDS_V1_EOL_BANNER',
  PLG_ENABLE_CROSS_GENERATION_ACCESS = 'PLG_ENABLE_CROSS_GENERATION_ACCESS',
  SRM_LOG_FEEDBACK_ENABLE_UI = 'SRM_LOG_FEEDBACK_ENABLE_UI',
  SRM_ENABLE_REQUEST_SLO = 'SRM_ENABLE_REQUEST_SLO',
  SRM_INTERNAL_CHANGE_SOURCE_CE = 'SRM_INTERNAL_CHANGE_SOURCE_CE',
  CDS_AWS_BACKOFF_STRATEGY = 'CDS_AWS_BACKOFF_STRATEGY',
  CD_ONBOARDING_HELP_ENABLED = 'CD_ONBOARDING_HELP_ENABLED',
  CDS_ENCRYPT_TERRAFORM_APPLY_JSON_OUTPUT = 'CDS_ENCRYPT_TERRAFORM_APPLY_JSON_OUTPUT',
  CDS_GIT_CONFIG_FILES = 'CDS_GIT_CONFIG_FILES',
  CDS_SERVICENOW_TICKET_TYPE_V2 = 'CDS_SERVICENOW_TICKET_TYPE_V2',
  PLG_NO_INTENT_EXPOSURE_ENABLED = 'PLG_NO_INTENT_EXPOSURE_ENABLED',
  PLG_NO_INTENT_AB = 'PLG_NO_INTENT_AB',
  CDS_TERRAFORM_S3_NG = 'CDS_TERRAFORM_S3_NG',
  CDS_AZURE_WEBAPP_NG_LISTING_APP_NAMES_AND_SLOTS = 'CDS_AZURE_WEBAPP_NG_LISTING_APP_NAMES_AND_SLOTS',
  PL_IP_ALLOWLIST_NG = 'PL_IP_ALLOWLIST_NG',
  PLG_SERVICE_DELEGATE_EXPOSURE_ENABLED = 'PLG_SERVICE_DELEGATE_EXPOSURE_ENABLED',
  PLG_SERVICE_DELEGATE_AB = 'PLG_SERVICE_DELEGATE_AB',
  CDS_NG_TRIGGER_SELECTIVE_STAGE_EXECUTION = 'CDS_NG_TRIGGER_SELECTIVE_STAGE_EXECUTION',
  NG_EXPRESSIONS_NEW_INPUT_ELEMENT = 'NG_EXPRESSIONS_NEW_INPUT_ELEMENT',
  SRM_ENABLE_JIRA_INTEGRATION = 'SRM_ENABLE_JIRA_INTEGRATION',
  PL_USE_CREDENTIALS_FROM_DELEGATE_FOR_GCP_SM = 'PL_USE_CREDENTIALS_FROM_DELEGATE_FOR_GCP_SM',
  CHAOS_DASHBOARD_ENABLED = 'CHAOS_DASHBOARD_ENABLED',
  BUILD_CREDITS_VIEW = 'BUILD_CREDITS_VIEW',
  CDS_NOT_ALLOW_READ_ONLY_SECRET_MANAGER_TERRAFORM_TERRAGRUNT_PLAN = 'CDS_NOT_ALLOW_READ_ONLY_SECRET_MANAGER_TERRAFORM_TERRAGRUNT_PLAN',
  CDS_SUPPORT_TICKET_DEFLECTION = 'CDS_SUPPORT_TICKET_DEFLECTION',
  PIE_GITX_OAUTH = 'PIE_GITX_OAUTH',
  USE_OLD_GIT_SYNC = 'USE_OLD_GIT_SYNC',
  CDS_K8S_SERVICE_HOOKS_NG = 'CDS_K8S_SERVICE_HOOKS_NG',
  POST_PROD_ROLLBACK = 'POST_PROD_ROLLBACK',
  CDS_TRIGGER_ACTIVITY_PAGE = 'CDS_TRIGGER_ACTIVITY_PAGE',
  SRM_SPLUNK_SIGNALFX = 'SRM_SPLUNK_SIGNALFX',
  CDS_HTTP_STEP_NG_CERTIFICATE = 'CDS_HTTP_STEP_NG_CERTIFICATE',
  PIE_MULTISELECT_AND_COMMA_IN_ALLOWED_VALUES = 'PIE_MULTISELECT_AND_COMMA_IN_ALLOWED_VALUES',
  PL_ENABLE_MULTIPLE_IDP_SUPPORT = 'PL_ENABLE_MULTIPLE_IDP_SUPPORT',
  CDB_MFE_ENABLED = 'CDB_MFE_ENABLED',
  CDP_AWS_SAM = 'CDP_AWS_SAM',
  PLG_CD_GET_STARTED_AB = 'PLG_CD_GET_STARTED_AB',
  PLG_GET_STARTED_EXPOSURE_ENABLED = 'PLG_GET_STARTED_EXPOSURE_ENABLED',
  CUSTOM_DASHBOARDS_NEXT = 'CUSTOM_DASHBOARDS_NEXT',
  CDS_SERVICE_OVERRIDES_2_0 = 'CDS_SERVICE_OVERRIDES_2_0',
  CDS_ENCODE_HTTP_STEP_URL = 'CDS_ENCODE_HTTP_STEP_URL',
  SRM_ENABLE_GRAFANA_LOKI_LOGS = 'SRM_ENABLE_GRAFANA_LOKI_LOGS',
  CDS_SERVICENOW_REFRESH_TOKEN_AUTH = 'CDS_SERVICENOW_REFRESH_TOKEN_AUTH',
  CI_PYTHON_TI = 'CI_PYTHON_TI',
  CI_ENABLE_DLC = 'CI_ENABLE_DLC',
  CDS_TEMPLATE_ERROR_HANDLING = 'CDS_TEMPLATE_ERROR_HANDLING',
  SRM_MICRO_FRONTEND = 'SRM_MICRO_FRONTEND',
  SRM_ENABLE_BASELINE_BASED_VERIFICATION = 'SRM_ENABLE_BASELINE_BASED_VERIFICATION',
  CDS_RANCHER_SUPPORT_NG = 'CDS_RANCHER_SUPPORT_NG',
  PL_DISCOVERY_ENABLE = 'PL_DISCOVERY_ENABLE',
  PL_ENABLE_JIT_USER_PROVISION = 'PL_ENABLE_JIT_USER_PROVISION',
  CDS_PIPELINE_STUDIO_UPGRADES = 'CDS_PIPELINE_STUDIO_UPGRADES',
  IDP_ENABLE_EDIT_HARNESS_CI_CD_PLUGIN = 'IDP_ENABLE_EDIT_HARNESS_CI_CD_PLUGIN',
  CDS_AUTO_APPROVAL = 'CDS_AUTO_APPROVAL',
  SRM_COMMON_MONITORED_SERVICE = 'SRM_COMMON_MONITORED_SERVICE',
  CDS_CONTAINER_STEP_GROUP = 'CDS_CONTAINER_STEP_GROUP',
  PL_FAVORITES = 'PL_FAVORITES',
  PIE_RETRY_STEP_GROUP = 'PIE_RETRY_STEP_GROUP',
  PIE_STATIC_YAML_SCHEMA = 'PIE_STATIC_YAML_SCHEMA',
  PL_HELM2_DELEGATE_BANNER = 'PL_HELM2_DELEGATE_BANNER',
  CDS_SUPPORT_SKIPPING_BG_DEPLOYMENT_NG = 'CDS_SUPPORT_SKIPPING_BG_DEPLOYMENT_NG',
  CI_AI_ENHANCED_REMEDIATIONS = 'CI_AI_ENHANCED_REMEDIATIONS',
  CD_AI_ENHANCED_REMEDIATIONS = 'CD_AI_ENHANCED_REMEDIATIONS',
  CHAOS_SECURITY_GOVERNANCE = 'CHAOS_SECURITY_GOVERNANCE',
  PIE_WEBHOOK_NOTIFICATION = 'PIE_WEBHOOK_NOTIFICATION',
  SRM_ENABLE_SIMPLE_VERIFICATION = 'SRM_ENABLE_SIMPLE_VERIFICATION',
  PL_AI_SUPPORT_CHATBOT = 'PL_AI_SUPPORT_CHATBOT',
  CCM_ENABLE_AZURE_CLOUD_ASSET_GOVERNANCE_UI = 'CCM_ENABLE_AZURE_CLOUD_ASSET_GOVERNANCE_UI',
  CDS_SERVERLESS_V2 = 'CDS_SERVERLESS_V2',
  CHAOS_IMAGE_REGISTRY_DEV = 'CHAOS_IMAGE_REGISTRY_DEV'
}
