import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Snow is a clean, flat theme
import { Box } from '@mui/material';

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image', 'video'
];

const modules = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
    [{size: []}],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, 
     {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image'],
    ['clean']
  ],
};

const RichTextEditor = ({ value, onChange }) => {
  return (
    <Box sx={{
      '& .ql-toolbar': {
        borderTopLeftRadius: '4px',
        borderTopRightRadius: '4px',
        borderColor: 'rgba(255, 255, 255, 0.23)',
      },
      '& .ql-container': {
        borderBottomLeftRadius: '4px',
        borderBottomRightRadius: '4px',
        borderColor: 'rgba(255, 255, 255, 0.23)',
        minHeight: '150px'
      },
      '& .ql-editor': {
        color: 'text.primary',
      }
    }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
    </Box>
  );
};

export default RichTextEditor;