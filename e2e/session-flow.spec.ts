// For Integration Test

import { test, expect, Page } from '@playwright/test'

async function createTask(page: Page, title: string) {
  await page.getByPlaceholder('What will you forge today?').fill(title)
  await page.getByRole('button', { name: '+' }).click()
  return page.getByTestId(`task-item-${title}`)
}

async function openLauncher(page: Page, taskRow: ReturnType<Page['getByTestId']>) {
  await taskRow.getByTestId('launch-session-button').click()
}

// Runs launcher: steps 1 (mode), 3 (tab) and 4 (commitment + start).
async function pickModeThenTimer(page: Page, timerStepAction: () => Promise<void>) {
  await page.getByText('deep-focus', { exact: true }).click()
  await timerStepAction()
  await page.getByText('Single tab', { exact: true }).click()
  await page.getByPlaceholder(/finish chapter/i).fill('Finish reading chapter 3')
  await page.getByRole('button', { name: /start session/i }).click()
}

test.describe('Integration: launcher -> timer -> check-in -> summary -> dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('you@domain.com').fill(process.env.E2E_TEST_EMAIL!)
    await page.getByPlaceholder('••••••••').fill(process.env.E2E_TEST_PASSWORD!)
    await page.getByRole('button', { name: /log in/i }).click()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText('Loading tasks...')).toBeHidden()
  })

  test('completes a full session and the dashboard reflects it', async ({ page }) => {
    // Set up a task to launch a session
    const taskTitle = `E2E session test ${Date.now()}`
    const taskRow = await createTask(page, taskTitle)
    await openLauncher(page, taskRow)

    // Launcher
    await pickModeThenTimer(page, () => page.getByText(/open session/i).click())

    // Timer
    await expect(page.getByText('End Session')).toBeVisible()

    // Trigger a real tab-switch
    const secondTab = await page.context().newPage()
    await secondTab.waitForTimeout(1000)
    await secondTab.close()

    // Check-in interval is 30s here via NEXT_PUBLIC_CHECKIN_INTERVAL_MS
    // (playwright.config.ts webServer.env) - real users get the full 25min
    // default. Give it margin either way.
    await expect(page.getByText(/still focusing/i)).toBeVisible({ timeout: 45000 })
    await page.getByRole('button', { name: /yes, i.m here/i }).click()

    await page.getByText('End Session').click()
    await page.waitForURL(/\/dashboard/)

    // Summary
    await expect(page.getByText('Session complete')).toBeVisible()
    await page.getByText('⭐').nth(3).click()
    await page.getByRole('button', { name: '✓ Yes' }).click()
    await page.getByRole('button', { name: /save session/i }).click()

    await expect(page.getByText('Session saved!')).toBeVisible()
    await page.getByRole('button', { name: /back to dashboard/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()
  })

  test('records a missed check-in when the user does not respond in time', async ({ page }) => {
    // Longer than the 90s file-wide default: 45s margin waiting for the
    // check-in to fire, plus the 15s response window it then has to expire,
    // plus setup/save overhead on either side.
    test.setTimeout(120_000)

    const taskTitle = `E2E missed check-in ${Date.now()}`
    const taskRow = await createTask(page, taskTitle)
    await openLauncher(page, taskRow)

    await pickModeThenTimer(page, () => page.getByText(/open session/i).click())
    await expect(page.getByText('End Session')).toBeVisible()

    // Miss the checkin
    await expect(page.getByText(/still focusing/i)).toBeVisible({ timeout: 45000 })
    await expect(page.getByText(/still focusing/i)).toBeHidden({ timeout: 20000 })

    await page.getByText('End Session').click()
    await page.waitForURL(/\/dashboard/)

    // Summary should show the miss
    await expect(page.getByText('Session complete')).toBeVisible()
    await expect(page.getByText(/^0\/\d+$/)).toBeVisible()

    // Finish saving it like a real user, to confirm the missed
    // check-in round-trips through POST /api/sessions correctly too
    await page.getByText('⭐').nth(2).click()
    await page.getByRole('button', { name: '✓ Yes' }).click()
    await page.getByRole('button', { name: /save session/i }).click()
    await expect(page.getByText('Session saved!')).toBeVisible()
    await page.getByRole('button', { name: /back to dashboard/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()
  })

  test('runs a timed (countdown) session and can end it early', async ({ page }) => {
    const taskTitle = `E2E timed session ${Date.now()}`
    const taskRow = await createTask(page, taskTitle)
    await openLauncher(page, taskRow)

    // Pick timed session
    await pickModeThenTimer(page, () => page.getByRole('button', { name: '25 min' }).click())

    await expect(page.getByText('End Session')).toBeVisible()

    // FloatingTimer.tsx labels a timed session's clock "remaining" to confirm it is in timer mode
    await expect(page.getByText('remaining')).toBeVisible()

    const timerDisplay = page.getByTestId('timer-display')
    const initialText = (await timerDisplay.textContent())!.trim()
    const initialSeconds = parseMinutesSeconds(initialText)
    expect(initialSeconds).toBeGreaterThan(24 * 60)

    // Confirm it's actually counting down
    await page.waitForTimeout(3000)
    const laterText = (await timerDisplay.textContent())!.trim()
    const laterSeconds = parseMinutesSeconds(laterText)
    expect(laterSeconds).toBeLessThan(initialSeconds)

    // Don't wait out a real 25-minute countdown - end it early, check if our flow is still smooth
    await page.getByText('End Session').click()
    await page.waitForURL(/\/dashboard/)

    await expect(page.getByText('Session complete')).toBeVisible()
    await page.getByText('⭐').nth(3).click()
    await page.getByRole('button', { name: '✓ Yes' }).click()
    await page.getByRole('button', { name: /save session/i }).click()
    await expect(page.getByText('Session saved!')).toBeVisible()
    await page.getByRole('button', { name: /back to dashboard/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()
  })

  test('creates, edits, and deletes a task from the dashboard', async ({ page }) => {
    const originalTitle = `E2E task mgmt ${Date.now()}`
    const editedTitle = `${originalTitle} (edited)`

    // Creating task
    const taskRow = await createTask(page, originalTitle)
    await expect(taskRow).toBeVisible()

    // Editing
    await taskRow.getByText(originalTitle, { exact: true }).dblclick()
    const editInput = taskRow.locator('input')
    await editInput.fill(editedTitle)
    await editInput.press('Enter')
    await expect(page.getByTestId(`task-item-${editedTitle}`)).toBeVisible()

    // Deleting the item
    page.once('dialog', (dialog) => dialog.accept())
    const editedRow = page.getByTestId(`task-item-${editedTitle}`)
    await editedRow.getByText('×', { exact: true }).click()
    await expect(page.getByTestId(`task-item-${editedTitle}`)).toBeHidden()
  })
})

function parseMinutesSeconds(text: string): number {
  const parts = text.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  throw new Error(`Unexpected timer display format: "${text}"`)
}
