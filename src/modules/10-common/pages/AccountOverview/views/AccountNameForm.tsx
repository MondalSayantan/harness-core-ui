import React from 'react'
import * as Yup from 'yup'
import { Button, FormInput, Formik, FormikForm, Layout } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { useToaster } from '@common/components'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useUpdateAccountNameNG } from 'services/cd-ng'
import { NameSchema } from '@common/utils/Validation'

interface FormValues {
  name: string
}

interface AccountNameFormProps {
  name: string
  setUpdateAccountName: (value: boolean) => void
  refetchAcct: () => void
}

const AccountNameForm: React.FC<AccountNameFormProps> = ({
  name,
  setUpdateAccountName,
  refetchAcct
}: AccountNameFormProps) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { mutate: updateAcctName, loading: updatingAcctName, cancel } = useUpdateAccountNameNG({
    accountIdentifier: accountId
  })

  const handleSubmit = async (values: FormValues): Promise<FormValues> => {
    try {
      await updateAcctName({
        name: values.name
      })
      refetchAcct()
    } catch (err) {
      showError(err.data?.message || getString('somethingWentWrong'))
    }
    setUpdateAccountName(false)
    return values
  }

  return (
    <Formik<FormValues>
      initialValues={{
        name: name
      }}
      onSubmit={(value: FormValues) => handleSubmit(value)}
      formName="accountNameForm"
      validationSchema={Yup.object().shape({
        name: NameSchema()
      })}
    >
      {() => (
        <FormikForm>
          <Layout.Horizontal spacing="medium">
            <FormInput.Text name="name" />
            <Button intent="primary" text={getString('save')} type="submit" disabled={updatingAcctName} />
            <Button
              text={getString('cancel')}
              onClick={() => {
                if (updatingAcctName) {
                  cancel()
                }
                setUpdateAccountName(false)
              }}
            />
          </Layout.Horizontal>
        </FormikForm>
      )}
    </Formik>
  )
}

export default AccountNameForm
