import type { DSConfig } from '@wings-software/swagger-ts/definitions'

export const RouteVerificationTypeToVerificationType: { [routeType: string]: DSConfig['type'] } = {
  'app-dynamics': 'APP_DYNAMICS',
  splunk: 'SPLUNK'
}

export const VerificationTypeToRouteVerificationType: { [type: string]: string } = {
  APP_DYNAMICS: 'app-dynamics',
  SPLUNK: 'splunk'
}

export const connectorId = '3qO35Lj9RvGHyQSL5S5uBw' //'r3vdWFQsRHOPrdol-6URBg' //
export const accountId = 'kmpySmUISimoRrJL6NL73w'
export const appId = 'G7YBOyWfRmyih-TsQIbguA' //t0-jbpLoR7S2BTsNfsk4Iw'
export const projectIdentifier = '1234'
