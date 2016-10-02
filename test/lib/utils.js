import test from 'ava'

import utils from '../../lib/utils'

test('.reverse', t => {
  const string = utils.reverse('abcdefghijklmnopqrstuvwxyz')

  t.is(string, 'zyxwvutsrqponmlkjihgfedcba')
})

test('.generateContentDisposition (application/zip)', t => {
  const metadata = {contentType: 'application/zip', filename: 'Test File.zip'}
  const header = utils.generateContentDisposition(metadata)

  t.is(header, 'attachment; filename="Test File.zip"')
})


test('.generateContentDisposition (text/plain)', t => {
  const metadata = {contentType: 'text/plain', filename: 'Test File.txt'}
  const header = utils.generateContentDisposition(metadata)

  t.is(header, 'inline; filename="Test File.txt"')
})

test('.generateContentDisposition (text/plain + UTF-8)', t => {
  const metadata = {contentType: 'text/plain', filename: 'じーっ.txt'}
  const header = utils.generateContentDisposition(metadata)

  t.is(header, 'inline; filename="%E3%81%98%E3%83%BC%E3%81%A3.txt"; filename*=UTF-8\'\'%E3%81%98%E3%83%BC%E3%81%A3.txt')
})

test('.generateContentDisposition (text/plain + empty)', t => {
  const metadata = {contentType: 'text/plain'}
  const header = utils.generateContentDisposition(metadata)

  t.is(header, 'inline')
})

test('.parseContentDisposition', t => {
  const result = utils.parseContentDisposition('attachment; filename="Test%20File.zip"')

  t.is(result.type, 'attachment')
  t.is(result.filename, 'Test File.zip')
})

test('.parseContentDisposition (empty)', t => {
  const result = utils.parseContentDisposition('')

  t.is(result.type, null)
  t.is(result.filename, null)
})

test('.sanitizeFilename', t => {
  const filename = utils.sanitizeFilename('"t\x00est";<file>*.zip')

  t.is(filename, '_t_est___file__.zip')
})

test('.getFileExtension', t => {
  const fileExtension = utils.getFileExtension('test.zip')

  t.is(fileExtension, '.zip')
})

test('.getFileExtension (double extensions)', t => {
  const fileExtension = utils.getFileExtension('test.tar.gz')

  t.is(fileExtension, '.tar.gz')
})
