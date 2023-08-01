/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react/display-name */
import React, { ReactNode } from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import * as documentTitle from '@common/hooks/useDocumentTitle'
import ListingPageTemplate, { ListingPageTemplateProps } from '../ListingPageTemplate'

jest.mock('@harness/uicore', () => {
  const fullModule = jest.requireActual('@harness/uicore')

  return {
    ...fullModule,
    PageSpinner: () => <span data-testid="page-spinner">Page Spinner</span>
  }
})

const renderComponent = (
  content: ReactNode,
  props: Partial<ListingPageTemplateProps> = {},
  wrapperProps?: Partial<TestWrapperProps>
): RenderResult =>
  render(
    <TestWrapper {...wrapperProps}>
      <ListingPageTemplate title="Test Listing Page" {...props}>
        {content}
      </ListingPageTemplate>
    </TestWrapper>
  )

describe('ListingPageTemplate', () => {
  beforeEach(() => jest.clearAllMocks())

  test('it should display the passed contents', async () => {
    const testId = 'DUMMY-COMPONENT-TEST-ID'
    renderComponent(<span data-testid={testId}>TEST CONTENT</span>)

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })

  test('it should display the title and attempt to set it as the document title', async () => {
    const useDocumentTitleMock = jest.spyOn(documentTitle, 'useDocumentTitle')
    const title = 'TEST TITLE'

    renderComponent('content', { title })

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(useDocumentTitleMock).toHaveBeenCalledWith(title)
  })

  test('it should set the title tooltip id data attribute', async () => {
    const titleTooltipId = 'TEST-TOOLTIP-ID'
    renderComponent('content', { titleTooltipId })

    expect(document.querySelector('[data-tooltip-id]')).toHaveAttribute('data-tooltip-id', titleTooltipId)
  })

  test('it should display the loading spinner when loading is set as true', async () => {
    const content = 'THIS SHOULD NOT BE VISIBLE'

    renderComponent(content, { loading: true })

    expect(screen.queryByText(content)).not.toBeInTheDocument()
    expect(screen.getByTestId('page-spinner')).toBeInTheDocument()
  })

  test('it should display the error message when error is passed', async () => {
    const content = 'THIS SHOULD NOT BE VISIBLE'
    const message = 'TEST ERROR MESSAGE'

    renderComponent(content, { error: { message } })

    expect(screen.queryByText(content)).not.toBeInTheDocument()
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  test('it should display the retry button when an error occurs', async () => {
    const retryOnErrorMock = jest.fn()

    renderComponent('content', { error: { message: 'error' }, retryOnError: retryOnErrorMock })

    const btn = screen.getByRole('button', { name: 'Retry' })
    expect(btn).toBeInTheDocument()
    expect(retryOnErrorMock).not.toHaveBeenCalled()

    await userEvent.click(btn)

    await waitFor(() => {
      expect(retryOnErrorMock).toHaveBeenCalled()
    })
  })

  test('it should display link to page documentation under the header if passed', async () => {
    const testUrl = 'https://google.com'

    renderComponent('content', {
      docsURL: testUrl
    })

    expect(screen.getByRole('link', { name: /cf.shared.readDocumentation/ })).toHaveAttribute('href', testUrl)
  })

  test('it should display link to video tutorial under the header if passed & flag is toggled ON', async () => {
    renderComponent(
      'content',
      {
        videoHelp: { trackingConst: 'test tracking', label: 'Video Help Label' }
      },
      { defaultFeatureFlagValues: { FFM_7258_INTERCOM_VIDEO_LINKS: true } }
    )
    expect(screen.getByRole('link', { name: /Video Help Label/ })).toBeInTheDocument()
  })

  test('it should not display link to video tutorial under the header if flag is toggled OFF', async () => {
    renderComponent(
      'content',
      {
        videoHelp: { trackingConst: 'test tracking', label: 'Video Help Label' }
      },
      { defaultFeatureFlagValues: { FFM_7258_INTERCOM_VIDEO_LINKS: false } }
    )
    expect(screen.queryByRole('link', { name: /Video Help Label/ })).not.toBeInTheDocument()
  })

  test('it should not display link to page documentation or video help under the header if not passed', async () => {
    renderComponent('content')

    expect(screen.queryByRole('link', { name: /cf.shared.readDocumentation/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Video Help Label/ })).not.toBeInTheDocument()
  })

  test('it should display the toolbar if passed', async () => {
    const testId = 'TOOLBAR-TEST-ID'

    renderComponent('content', { toolbar: <span data-testid={testId}>Toolbar</span> })

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })

  test('it should display the pagination if passed', async () => {
    const testId = 'PAGINATION-TEST-ID'

    renderComponent('content', { pagination: <span data-testid={testId}>Pagination</span> })

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })
})
