/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const manifests = [
  {
    manifest: {
      identifier: 'HemlGCS',
      type: 'HelmChart',
      spec: {
        store: {
          type: 'Gcs',
          spec: {
            connectorRef: '<+input>',
            bucketName: '<+input>',
            folderPath: '<+input>'
          }
        },
        chartName: '<+input>',
        chartVersion: '<+input>',
        helmVersion: 'V2',
        skipResourceVersioning: false
      }
    }
  }
]

export const template = {
  manifests: [
    {
      manifest: {
        identifier: 'HemlGCS',
        type: 'HelmChart',
        spec: {
          store: {
            type: 'Gcs',
            spec: {
              connectorRef: '<+input>',
              bucketName: '<+input>',
              folderPath: '<+input>'
            }
          },
          chartName: '<+input>',
          chartVersion: '<+input>',
          helmVersion: 'V2',
          skipResourceVersioning: false
        }
      }
    }
  ]
}

export const path = 'stages[0].stage.spec.serviceConfig.serviceDefinition.spec'

export const stageIdentifier = 'STG1'
