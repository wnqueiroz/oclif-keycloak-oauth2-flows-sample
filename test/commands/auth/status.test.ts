import {expect, test} from '@oclif/test'

describe('auth/status', () => {
  test
  .stdout()
  .command(['auth/status'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['auth/status', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
