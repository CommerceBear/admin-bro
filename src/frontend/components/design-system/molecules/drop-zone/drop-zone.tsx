import React, { useState } from 'react'
import styled from 'styled-components'

import { Label } from '../../atoms/label'
import { Box } from '../../atoms/box'
import { Text } from '../../atoms/text'
import { MessageBox } from '../message-box'
import { DropZoneItem } from './drop-zone-item'

const validateContentType = (
  mimeTypes: undefined | Array<string>,
  mimeType: string,
): boolean => {
  if (!mimeTypes || !mimeTypes.length) { return true }
  return mimeTypes.includes(mimeType)
}

const validateSize = (
  maxSize: string | number | undefined,
  size: string | number | null,
): boolean => {
  if (!maxSize) { return true }
  if (!size) { return true }
  return +maxSize >= +size
}

const inKb = (size: string | number): string => {
  if (!size) { return '' }
  return `${Math.round(+size / 1024)} KB`
}

/**
 * @returns {void}
 * @memberof DropZone
 * @alias OnDropDownChange
 */
export type OnDropZoneChange = (files: Array<File>) => void

/**
 * @memberof DropZone
 * @alias DropZoneProps
 */
export type DropZoneProps = {
  multiple?: boolean;
  /**
   * Callback performed when the file is dropped/selected
   */
  onChange?: OnDropZoneChange;
  /**
   * Validate options
   */
  validate?: {
    /**
     * Maximum size of the uploaded file in bytes. If not defined - all files are allowed.
     */
    maxSize?: number;
    /**
     * Available mime types. When not defined - all mime types are allowed.
     */
    mimeTypes?: Array<string>;
  };
}

const UploadInput = styled.input`
  font-size: 100px;
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  bottom: 0;
  cursor: pointer;
  width: 100%;
`

const StyledDropZone = styled(Box)`
  border: 1px dashed ${({ theme }): string => theme.colors.grey80};
  position: relative;
  text-align: center;

  & ${Label} {
    color: ${({ theme }): string => theme.colors.grey60};
    font-size: ${({ theme }): string => theme.fontSizes.xs};
    padding-right: 4px;
    letter-spacing: 1px;
  }
`

type ErrorMessage = {
  message: string;
  title: string;
}

/**
 * DropZone which can be used for uploading files.
 *
 * General usage:
 * ```javascript
 * import { DropZone, DropZoneProps } from 'admin-bro'
 * ```
 *
 * how to use it in your custom component.tsx (TypesScript):
 * ```
 * import React, { useState } from 'react'
 * import { DropZone, Label, BasePropertyProps } from 'admin-bro'
 * import { unflatten } from 'flat'
 *
 * const UploadPhoto: React.FC<BasePropertyProps> = (props) => {
 *   const { property, record, onChange } = props
 *
 *   const onUpload = (files: FileList) => {
 *     const newRecord = {...record}
 *     const file = files.length && files[0]
 *
 *     onChange({
 *       ...newRecord,
 *       params: {
 *         ...newRecord.params,
 *         [property.name]: file,
 *       }
 *     })
 *     event.preventDefault()
 *   }
 *
 *   return (
 *     <Box>
 *       <Label>{property.label}</Label>
 *       <DropZone onChange={onUpload} />
 *     </Box>
 *   )
 * }
 * ```
 *
 * @component
 * @subcategory Molecules
 *
 * @example <caption>Single file with validation</caption>
 * const maxSize = 1024 * 100
 * const mimeTypes = ['application/pdf']
 * const onUpload = (files) => { alert(files,length ? files[0].name : 'no files' ) }
 * return (
 * <Box>
 *   <DropZone
 *     onChange={onUpload}
 *     validate= { { maxSize, mimeTypes } }
 *   />
 * </Box>
 * )
 *
 * @example <caption>Multi file of photos</caption>
 * const mimeTypes = ['image/png']
 * const onUpload = (files) => { alert(files.length ? files.length : 'no files' ) }
 * return (
 * <Box>
 *   <DropZone
 *     multiple
 *     onChange={onUpload}
 *     validate= { { mimeTypes } }
 *   />
 * </Box>
 * )
 */
export const DropZone: React.FC<DropZoneProps> = (props) => {
  const { validate, onChange, multiple, ...other } = props

  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<ErrorMessage | null>(null)
  const [filesToUpload, setFilesToUpload] = useState<Array<File>>([])

  const onDragEnter = (): void => setIsDragging(true)
  const onDragLeave = (): void => setIsDragging(false)
  const onDragOver = (): void => setIsDragging(true)

  const removeItem = (index: number): void => {
    const newItems = [...filesToUpload]
    newItems.splice(index, 1)
    if (onChange) {
      onChange(newItems)
    }
    setFilesToUpload(newItems)
  }

  const onDrop = (event: React.DragEvent | React.SyntheticEvent): void => {
    event.preventDefault()
    setIsDragging(false)

    const { files } = ((event as React.DragEvent).dataTransfer || event.target)
    const validatedFiles: Array<File> = []

    for (let i = 0; i < files.length; i += 1) {
      const file = files.item(i) as File
      if (!file) { return }
      if (validate && !validateSize(validate.maxSize, file && file.size)) {
        setError({ message: `File: ${file.name} size is too big`, title: 'Wrong Size' })
        return
      }
      if (validate && !validateContentType(validate.mimeTypes, file.type)) {
        setError({ message: `File: ${file.name} has unsupported type: ${file.type}`, title: 'Wrong Type' })
        return
      }
      validatedFiles.push(file)
      setError(null)
    }
    let newFiles
    if (!multiple && validatedFiles.length) {
      newFiles = [validatedFiles[0]]
    } else {
      newFiles = [
        ...filesToUpload,
        ...validatedFiles,
      ]
    }
    if (onChange) {
      onChange(newFiles)
    }
    setFilesToUpload(newFiles)
  }

  return (
    <Box>
      <StyledDropZone
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        {...other}
        p="xl"
      >
        <UploadInput type="file" onChange={(event): void => onDrop(event)} multiple={multiple} />
        <Box>
          <Text fontSize="sm">
            Pick or Drop File here to upload it.
          </Text>
          <Box>
            {validate && validate.maxSize ? (
              <Text variant="xs" color="grey60" lineHeight="default" mt="sm">
                <Label inline uppercase>Max size:</Label>
                {inKb(validate.maxSize)}
              </Text>
            ) : ''}
            {validate && validate.mimeTypes && validate.mimeTypes.length ? (
              <Text variant="xs" color="grey60" lineHeight="default" mt="sm">
                <Label inline uppercase>Available types:</Label>
                {validate.mimeTypes.join(', ')}
              </Text>
            ) : ''}
          </Box>
        </Box>
      </StyledDropZone>
      {error ? (
        <MessageBox
          mt="default"
          variant="danger"
          size="sm"
          icon="Warning"
          message={error.title}
          onCloseClick={(): void => setError(null)}
        >
          {error.message}
        </MessageBox>
      ) : ''}
      {filesToUpload.map((file, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <DropZoneItem file={file} key={index} onRemove={() => removeItem(index)} />
      ))}
    </Box>
  )
}

export default DropZone
