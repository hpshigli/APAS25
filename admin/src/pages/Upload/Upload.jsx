import React, { useState, useContext } from 'react';
import axios from 'axios';
import { StoreData } from '../../context/StoreData';
import { toast } from 'react-toastify';
import './Upload.css';

const Upload = ({ url }) => {
  const { adToken } = useContext(StoreData);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);

  const onFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors([]);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a CSV file to upload.');
      return;
    }
    if (!adToken) {
      toast.error('Please login as admin to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${url}/api/admin/upload-csv`, formData, {
        headers: {
          adToken,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success(response.data.message || 'File uploaded successfully!');
        setFile(null);
        setErrors([]);
      } else {
        if (response.data.errors && Array.isArray(response.data.errors)) {
          setErrors(response.data.errors);
          toast.error('File uploaded with some errors.');
        } else {
          toast.error(response.data.message || 'Upload failed.');
        }
      }
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className='csv-upload-container'>
      <form onSubmit={onSubmit} className='csv-upload-form'>
        <h2>Upload Student CSV</h2>
        <label htmlFor='csvFile'>Select CSV File:</label>
        <input
          type='file'
          id='csvFile'
          accept='.csv,text/csv'
          onChange={onFileChange}
          required
        />
        <button type='submit' className='upload-btn'>Upload</button>
        {errors.length > 0 && (
          <div className='error-log'>
            <h3>Errors in uploaded file:</h3>
            <ul>
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
};
export default Upload;
