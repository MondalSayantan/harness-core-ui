/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import { render, fireEvent, queryByText, queryByAttribute, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import { InputTypes, fillAtForm, clickSubmit } from '@common/utils/JestFormHelper'
import * as hostedBuilds from '@common/hooks/useHostedBuild'
import { GitConnectionType, GitUrlType } from '@platform/connectors/pages/connectors/utils/ConnectorUtils'
import { ConnectivityModeType } from '@common/components/ConnectivityMode/ConnectivityMode'
import CreateGithubConnector from '../CreateGithubConnector'
import {
  mockResponse,
  mockSecret,
  usernameTokenWithAPIAccessGithubApp,
  usernameTokenWithAPIAccessToken,
  githubAppConnector,
  backButtonMock,
  usernameTokenWithAPIAccessGithubAppManager,
  oAuthConnector
} from './githubMocks'
import { backButtonTest } from '../../commonTest'

const commonProps = {
  accountId: 'dummy',
  orgIdentifier: '',
  projectIdentifier: '',
  setIsEditMode: noop,
  onClose: noop,
  onSuccess: noop
}
const updateConnector = jest.fn()
const createConnector = jest.fn()
jest.mock('services/portal', () => ({
  useGetDelegateTags: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegatesStatus: jest.fn().mockImplementation(() => {
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetDelegateFromId: jest.fn().mockImplementation(() => jest.fn()),
  useGetDelegateSelectorsUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetDelegatesUpTheHierarchy: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

jest.mock('services/cd-ng', () => ({
  validateTheIdentifierIsUniquePromise: jest.fn().mockImplementation(() => Promise.resolve(mockResponse)),
  useCreateConnector: jest.fn().mockImplementation(() => ({ mutate: createConnector })),
  useUpdateConnector: jest.fn().mockImplementation(() => ({ mutate: updateConnector })),
  getSecretV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecret)),
  useGetTestConnectionResult: jest.fn().mockImplementation(() => jest.fn()),
  useGetFileContent: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useGetFileByBranch: jest.fn().mockImplementation(() => ({ refetch: jest.fn() })),
  useCreatePR: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useCreatePRV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() }))
}))

describe('Create Github connector Wizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('Creating Github step one', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )
    // fill step 1
    await act(async () => {
      clickSubmit(container)
    })

    expect(container).toMatchSnapshot() // Form validation for all required fields in step one
  })

  test('Creating Github step one and step two for HTTPS', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )

    // fill step 1
    const nameInput = queryByAttribute('name', container, 'name')
    expect(nameInput).toBeTruthy()
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'dummy name' } })
    await act(async () => {
      clickSubmit(container)
    })

    fillAtForm([
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'url',
        value: 'http://www.github.com/'
      }
    ])

    expect(container).toMatchSnapshot() // matching snapshot with data
    await act(async () => {
      clickSubmit(container)
    })
    //step 3
    await act(async () => {
      clickSubmit(container)
    })
    expect(container).toMatchSnapshot() // Form validation for all required fields
    expect(createConnector).toBeCalledTimes(0)
  })

  test('Creating Github step two for SSH key', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )

    // fill step 1
    const nameInput = queryByAttribute('name', container, 'name')
    expect(nameInput).toBeTruthy()
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'dummy name' } })
    await act(async () => {
      clickSubmit(container)
    })

    fillAtForm([
      {
        container,
        type: InputTypes.RADIOS,
        fieldId: 'connectionType',
        value: GitConnectionType.SSH
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'url',
        value: 'git@github.com/account'
      }
    ])

    expect(container).toMatchSnapshot() // matching snapshot with data
    await act(async () => {
      clickSubmit(container)
    })
    //step 3
    await act(async () => {
      clickSubmit(container)
    })
    expect(container).toMatchSnapshot() // Form validation for all required fields
    expect(createConnector).toBeCalledTimes(0)
  })

  test('should render form for edit http and authtype username-token with API access', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={usernameTokenWithAPIAccessGithubApp}
          mock={mockResponse}
          connectivityMode={ConnectivityModeType.Delegate}
        />
      </TestWrapper>
    )
    await act(async () => {
      clickSubmit(container)
    })
    await act(async () => {
      clickSubmit(container)
    })
    // step 3
    expect(queryByText(container, 'common.git.enableAPIAccess')).toBeTruthy()
    expect(container).toMatchSnapshot()

    //connectivity mode step
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    // delegate selector step
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })
    // test connection
    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    expect(updateConnector).toBeCalledTimes(1)
    expect(updateConnector).toBeCalledWith(
      {
        connector: usernameTokenWithAPIAccessGithubApp
      },
      { queryParams: {} } // gitSync disabled for account level
    )
  })

  test('should form for edit http and authtype username-token with API access', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={usernameTokenWithAPIAccessToken}
          mock={mockResponse}
          connectivityMode={ConnectivityModeType.Delegate}
        />
      </TestWrapper>
    )
    await act(async () => {
      clickSubmit(container)
    })
    await act(async () => {
      clickSubmit(container)
    })
    expect(container).toMatchSnapshot()
    // step 3
    expect(queryByText(container, 'common.git.enableAPIAccess')).toBeTruthy()
    expect(container).toMatchSnapshot()

    await act(async () => {
      clickSubmit(container)
    })

    await act(async () => {
      clickSubmit(container)
    })

    await act(async () => {
      clickSubmit(container)
    })

    expect(updateConnector).toBeCalledWith(
      {
        connector: usernameTokenWithAPIAccessToken
      },
      { queryParams: {} } // gitSync disabled for account level
    )
  })

  backButtonTest({
    Element: (
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector {...commonProps} isEditMode={true} connectorInfo={backButtonMock} mock={mockResponse} />
      </TestWrapper>
    ),
    backButtonSelector: '[data-name="commonGitBackButton"]',
    mock: backButtonMock
  })

  test('Invalid http url for creating Github step two', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )

    // fill step 1
    const nameInput = queryByAttribute('name', container, 'name')
    expect(nameInput).toBeTruthy()
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'dummy name' } })
    await act(async () => {
      clickSubmit(container)
    })

    fillAtForm([
      {
        container,
        type: InputTypes.RADIOS,
        fieldId: 'connectionType',
        value: GitConnectionType.HTTP
      },
      {
        container,
        type: InputTypes.TEXTFIELD,
        fieldId: 'url',
        value: 'git@github.com/account' // should be http
      }
    ])

    await act(async () => {
      clickSubmit(container)
    })
    await waitFor(() => expect(() => queryByText(document.body, 'validation.urlIsNotValid')).toBeDefined())
  })

  test('should render form for edit http and authtype username-token with API access connectivity mode Manager', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={usernameTokenWithAPIAccessGithubAppManager}
          mock={mockResponse}
          connectivityMode={ConnectivityModeType.Manager}
        />
      </TestWrapper>
    )
    await act(async () => {
      clickSubmit(container)
    })
    await act(async () => {
      clickSubmit(container)
    })
    // step 3
    expect(queryByText(container, 'common.git.enableAPIAccess')).toBeTruthy()
    expect(container).toMatchSnapshot()

    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    await act(async () => {
      fireEvent.click(container.querySelector('button[type="submit"]')!)
    })

    expect(updateConnector).toBeCalledTimes(1)
    expect(updateConnector).toBeCalledWith(
      {
        connector: usernameTokenWithAPIAccessGithubAppManager
      },
      { queryParams: {} } // gitSync disabled for account level
    )
  })

  test('Render OAuth git authentication view', async () => {
    window.addEventListener = jest.fn()
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        text: () => Promise.resolve('https://github.com/auth/login')
      })
    )
    jest.spyOn(hostedBuilds, 'useHostedBuilds').mockReturnValue({
      enabledHostedBuildsForFreeUsers: true,
      enabledHostedBuilds: false
    })
    const { container, getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={oAuthConnector}
          mock={mockResponse}
          connectivityMode={ConnectivityModeType.Manager}
          status={{ status: 'SUCCESS' }}
        />
      </TestWrapper>
    )
    await act(async () => {
      clickSubmit(container)
    })
    await act(async () => {
      clickSubmit(container)
    })

    expect(container.querySelector('input[name="authType"][value="common.oAuthLabel"]')).toBeInTheDocument()

    expect(getByText('common.oAuth.configured')).toBeInTheDocument()

    const relinkBtn = getByText('platform.connectors.relinkToGitProvider')

    expect(relinkBtn).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(relinkBtn)
    })

    expect(getByText('common.oAuth.inProgress')).toBeInTheDocument()

    expect(global.fetch).toBeCalled()
  })

  test('Validating Account & Repo level connector placeholders', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateGithubConnector {...commonProps} isEditMode={false} connectorInfo={undefined} mock={mockResponse} />
      </TestWrapper>
    )

    // fill step 1
    const nameInput = queryByAttribute('name', container, 'name')
    expect(nameInput).toBeTruthy()
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'dummy name' } })
    await act(async () => {
      clickSubmit(container)
    })

    expect(queryByAttribute('placeholder', container, 'common.git.gitHubUrlPlaceholder')).toBeInTheDocument()

    fillAtForm([
      {
        container,
        fieldId: 'connectionType',
        type: InputTypes.RADIOS,
        value: GitConnectionType.SSH
      }
    ])

    expect(queryByAttribute('placeholder', container, 'common.git.gitHubUrlPlaceholderSSH')).toBeInTheDocument()

    fillAtForm([
      {
        container,
        fieldId: 'connectionType',
        type: InputTypes.RADIOS,
        value: GitConnectionType.HTTP
      },
      {
        container,
        fieldId: 'urlType',
        type: InputTypes.RADIOS,
        value: GitUrlType.REPO
      }
    ])

    expect(queryByAttribute('placeholder', container, 'common.git.gitHubRepoUrlPlaceholder')).toBeInTheDocument()

    fillAtForm([
      {
        container,
        fieldId: 'connectionType',
        type: InputTypes.RADIOS,
        value: GitConnectionType.SSH
      }
    ])

    expect(queryByAttribute('placeholder', container, 'common.git.gitHubRepoUrlPlaceholderSSH')).toBeInTheDocument()
  })

  test('should render form for edit http and authtype github app', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path="/account/:accountId/resources/connectors"
        pathParams={{ accountId: 'dummy' }}
        defaultFeatureFlagValues={{ CDS_GITHUB_APP_AUTHENTICATION: true }}
      >
        <CreateGithubConnector
          {...commonProps}
          isEditMode={true}
          connectorInfo={githubAppConnector}
          mock={mockResponse}
          connectivityMode={ConnectivityModeType.Delegate}
        />
      </TestWrapper>
    )

    await act(async () => {
      clickSubmit(container)
    })

    await act(async () => {
      clickSubmit(container)
    })

    // step 3
    expect(getByText('common.git.installationId')).toBeInTheDocument()
    expect(getByText('common.git.applicationId')).toBeInTheDocument()
    expect(getByText('common.git.privateKey')).toBeInTheDocument()

    // connectivity Mode
    await act(async () => {
      clickSubmit(container)
    })

    // test Connection
    await act(async () => {
      clickSubmit(container)
    })

    expect(updateConnector).toBeCalledTimes(1)
    expect(updateConnector).toBeCalledWith(
      {
        connector: githubAppConnector
      },
      { queryParams: {} } // gitSync disabled for account level
    )
  })
})