/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import BillsUI from '../views/BillsUI.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import { ROUTES } from '../constants/routes'
import mockStore from '../__mocks__/store'

window.alert = jest.fn()

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then the form is displayed', () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })
    test('Then I can select upload an image file', () => {
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const selectFile = screen.getByTestId('file')
      const testFile = new File(['This is a test'], 'test.jpg', {
        type: 'image/jpeg',
      })

      selectFile.addEventListener('change', handleChangeFile)
      fireEvent.change(selectFile, { target: { files: [testFile] } })

      expect(handleChangeFile).toHaveBeenCalled()
      expect(selectFile.files[0]).toStrictEqual(testFile)
    })
    test("Then I can't select upload a non image file", () => {
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const selectFile = screen.getByTestId('file')
      const testFile = new File(['This is a test'], 'test.txt', {
        type: 'text/plain',
      })

      selectFile.addEventListener('change', handleChangeFile)
      fireEvent.change(selectFile, { target: { files: [testFile] } })

      expect(handleChangeFile).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalled()
    })
    describe('When I post a new bill', () => {
      test('Then I should be sent to the Bills page', async () => {
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        })
        window.localStorage.setItem(
          'user',
          JSON.stringify({ type: 'Employee' })
        )
        const html = NewBillUI()
        document.body.innerHTML = html
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const currentNewBill = new NewBill({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const formNewBill = screen.getByTestId('form-new-bill')
        expect(formNewBill).toBeTruthy()

        const handleSubmit = jest.fn((e) => currentNewBill.handleSubmit(e))
        formNewBill.addEventListener('submit', handleSubmit)
        fireEvent.submit(formNewBill)
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByText('Mes notes de frais')).toBeTruthy()
      })
    })
  })
})

//test d'intégration POST
describe('Given I am a user connected as Employee', () => {
  jest.spyOn(mockStore, 'bills')
  describe('When I post a new bill', () => {
    test('Then I should be send to the Bills page', () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const currentNewBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      const validBill = {
        type: 'Equipement et matériel',
        name: 'Test',
        date: '2022-02-14',
        amount: 145,
        vat: 20,
        pct: 10,
        commentary: 'Test',
        fileUrl:
          'https://tse1.mm.bing.net/th?id=OIP.u8y8vylcOc410--gfVcwcQAAAA&pid=Api',
        fileName: 'jest-logo.jpg',
        status: 'pending',
      }

      // Load the values in fields
      screen.getByTestId('expense-type').value = validBill.type
      screen.getByTestId('expense-name').value = validBill.name
      screen.getByTestId('datepicker').value = validBill.date
      screen.getByTestId('amount').value = validBill.amount
      screen.getByTestId('vat').value = validBill.vat
      screen.getByTestId('pct').value = validBill.pct
      screen.getByTestId('commentary').value = validBill.commentary

      currentNewBill.fileName = validBill.fileName
      currentNewBill.fileUrl = validBill.fileUrl

      currentNewBill.updateBill = jest.fn()
      const handleSubmit = jest.fn((e) => currentNewBill.handleSubmit(e))

      const form = screen.getByTestId('form-new-bill')
      form.addEventListener('submit', handleSubmit)
      expect(screen.getByText('Envoyer').type).toBe('submit')

      userEvent.click(screen.getByText('Envoyer'))

      expect(handleSubmit).toHaveBeenCalled()
      expect(currentNewBill.updateBill).toHaveBeenCalled()
    })

    //Errors 404 and 500 test
    describe('When an error occurs on API', () => {
      test('create bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error('Erreur 404'))
            },
          }
        })
        const html = BillsUI({ error: 'Erreur 404' })
        document.body.innerHTML = html
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test('fetches messages from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error('Erreur 500'))
            },
          }
        })

        const html = BillsUI({ error: 'Erreur 500' })
        document.body.innerHTML = html
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})