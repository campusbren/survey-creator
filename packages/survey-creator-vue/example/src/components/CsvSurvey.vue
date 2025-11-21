<template>
  <div class="csv-survey-container">
    <div class="header">
      <h2>📊 CSV-Based Survey Generator</h2>
      <p>Upload a CSV file to create a dynamic survey with custom field mappings</p>
    </div>

    <div v-if="autoRestored" class="alert alert-info">
      <span class="alert-icon">💾</span>
      <div class="alert-content">
        <strong>Auto-restored from previous session</strong>
        <p>Your last CSV data has been automatically loaded. Upload a new file to replace it.</p>
      </div>
      <button @click="autoRestored = false" class="alert-close">✕</button>
    </div>

    <div class="upload-section" v-if="!csvData.length">
      <div class="file-input-wrapper">
        <input 
          type="file" 
          id="csvFile" 
          accept=".csv" 
          @change="handleFileSelect"
          ref="fileInput"
        />
        <label for="csvFile" class="file-label">
          📁 Choose CSV File
        </label>
        <span v-if="selectedFileName" class="file-name">{{ selectedFileName }}</span>
      </div>
      <button 
        @click="uploadFile" 
        class="btn btn-primary"
        :disabled="!selectedFile"
      >
        Upload & Process
      </button>
    </div>

    <div v-if="csvData.length && !surveyGenerated" class="column-selector">
      <h3>Select Columns for Survey</h3>
      <div class="selector-grid">
        <div class="selector-item">
          <label for="displayCol">Display Column:</label>
          <select id="displayCol" v-model="displayColumn" class="form-control">
            <option v-for="col in columnNames" :key="col" :value="col">
              {{ col }}
            </option>
          </select>
          <small>This column will be shown to users</small>
        </div>

        <div class="selector-item">
          <label for="uuidCol">Unique ID Column:</label>
          <select id="uuidCol" v-model="uuidColumn" class="form-control">
            <option v-for="col in columnNames" :key="col" :value="col">
              {{ col }}
            </option>
          </select>
          <small>This column identifies each row uniquely</small>
        </div>
      </div>

      <div class="preview-data">
        <h4>Preview (First 5 rows):</h4>
        <div class="table-wrapper">
          <table class="table table-striped">
            <thead>
              <tr>
                <th v-for="col in columnNames" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in csvData.slice(0, 5)" :key="idx">
                <td v-for="col in columnNames" :key="col">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button @click="generateSurvey" class="btn btn-success">
        🚀 Generate Survey
      </button>
    </div>

    <div v-if="surveyGenerated" class="survey-section">
      <div class="survey-header">
        <h3>✨ Your CSV-Based Survey</h3>
        <button @click="resetSurvey" class="btn btn-secondary">
          ← Upload New CSV
        </button>
      </div>
      
      <div v-if="errorMessage" class="alert alert-error">
        <span class="alert-icon">❌</span>
        <div class="alert-content">
          <strong>Error Saving Response</strong>
          <p>{{ errorMessage }}</p>
        </div>
        <button @click="errorMessage = ''" class="alert-close">✕</button>
      </div>
      
      <div v-if="successMessage" class="alert alert-success">
        <span class="alert-icon">✅</span>
        <div class="alert-content">
          <strong>Success!</strong>
          <p>{{ successMessage }}</p>
        </div>
        <button @click="successMessage = ''" class="alert-close">✕</button>
      </div>
      
      <SurveyComponent v-if="surveyModel" :survey="surveyModel" />
    </div>

    <div v-if="responses.length > 0" class="responses-section">
      <h3>📋 Survey Responses ({{ responses.length }})</h3>
      <div class="responses-list">
        <div v-for="response in responses" :key="response.submission_id || response.uuid" class="response-item">
          <div class="response-header">
            <strong>{{ response.display_text }}</strong>
            <span class="timestamp">{{ formatDate(response.timestamp) }}</span>
          </div>
          <div class="response-meta" v-if="response.submission_id">
            <small>Submission ID: {{ response.submission_id }}</small>
          </div>
          <div class="response-data">
            <pre>{{ JSON.stringify(response.all_responses, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Papa from 'papaparse';
import { Model } from 'survey-core';
import { SurveyComponent } from 'survey-vue3-ui';
import 'survey-core/survey-core.min.css';

const csvData = ref([]);
const columnNames = ref([]);
const selectedFile = ref(null);
const selectedFileName = ref('');
const displayColumn = ref('');
const uuidColumn = ref('');
const surveyGenerated = ref(false);
const surveyModel = ref(null);
const fileInput = ref(null);
const responses = ref([]);
const errorMessage = ref('');
const successMessage = ref('');
const autoRestored = ref(false);

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    selectedFileName.value = file.name;
  }
};

const uploadFile = () => {
  if (!selectedFile.value) {
    alert('Please select a CSV file first!');
    return;
  }

  Papa.parse(selectedFile.value, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      csvData.value = results.data;
      columnNames.value = results.meta.fields;
      
      // Save to localStorage for auto-restore (with SSR guard)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('lastCsvData', JSON.stringify(results.data));
          localStorage.setItem('lastCsvColumns', JSON.stringify(results.meta.fields));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      }
      
      // Smart UUID column detection
      const uuidGuess = columnNames.value.find(col => 
        col.toLowerCase().includes('uuid') || 
        col.toLowerCase().includes('id') ||
        col.toLowerCase() === 'id'
      );
      
      // Check localStorage for saved preferences (with SSR guard)
      let savedDisplayCol = null;
      let savedUuidCol = null;
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        savedDisplayCol = localStorage.getItem('csvDisplayColumn');
        savedUuidCol = localStorage.getItem('csvUuidColumn');
      }
      
      // Use saved preferences if columns still exist, otherwise use smart defaults
      if (savedDisplayCol && columnNames.value.includes(savedDisplayCol)) {
        displayColumn.value = savedDisplayCol;
      } else {
        displayColumn.value = columnNames.value[0];
      }
      
      if (savedUuidCol && columnNames.value.includes(savedUuidCol)) {
        uuidColumn.value = savedUuidCol;
      } else if (uuidGuess) {
        uuidColumn.value = uuidGuess;
      } else {
        uuidColumn.value = columnNames.value[columnNames.value.length > 1 ? 1 : 0];
      }
    },
    error: (error) => {
      alert('Error parsing CSV: ' + error.message);
      // Clear corrupted localStorage on parse error
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem('lastCsvData');
        localStorage.removeItem('lastCsvColumns');
      }
    }
  });
};

const generateSurvey = () => {
  console.log('🎯 Generate Survey clicked!');
  console.log('Display Column:', displayColumn.value);
  console.log('UUID Column:', uuidColumn.value);
  console.log('CSV Data:', csvData.value);
  
  if (!displayColumn.value || !uuidColumn.value) {
    alert('Please select both display and UUID columns');
    return;
  }

  // Save column preferences to localStorage (with SSR guard)
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('csvDisplayColumn', displayColumn.value);
      localStorage.setItem('csvUuidColumn', uuidColumn.value);
    } catch (e) {
      console.error('Failed to save column preferences:', e);
    }
  }

  const choices = csvData.value.map(row => ({
    value: row[uuidColumn.value],
    text: row[displayColumn.value]
  }));
  
  console.log('Survey Choices:', choices);

  const surveyJson = {
    title: 'CSV-Based Selection Survey',
    description: 'Select an option from the uploaded CSV data',
    questions: [
      {
        type: 'dropdown',
        name: 'selected_option',
        title: `Choose from ${displayColumn.value}:`,
        choices: choices,
        isRequired: true
      }
    ],
    showQuestionNumbers: 'off',
    completeText: 'Submit Response'
  };
  
  console.log('Survey JSON:', surveyJson);

  const survey = new Model(surveyJson);

  survey.onComplete.add(sender => {
    const selectedUuid = sender.data.selected_option;
    const selectedRow = csvData.value.find(row => row[uuidColumn.value] === selectedUuid);
    const displayText = selectedRow ? selectedRow[displayColumn.value] : null;

    const payload = {
      uuid: selectedUuid,
      display_text: displayText,
      all_responses: sender.data
    };

    console.log('Survey Result:', payload);

    // Clear previous messages
    errorMessage.value = '';
    successMessage.value = '';

    // Send to API
    fetch('/api/survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to save response');
        }
        return data;
      })
      .then(data => {
        console.log('Response saved:', data);
        successMessage.value = `Response saved successfully! Submission ID: ${data.submission_id}`;
        loadResponses();
        
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => {
          successMessage.value = '';
        }, 5000);
      })
      .catch(error => {
        console.error('Error saving response:', error);
        errorMessage.value = `${error.message}. Please try again or contact support if the problem persists.`;
      });
  });

  surveyModel.value = survey;
  surveyGenerated.value = true;
  console.log('✅ Survey generated and ready to render!');
};

const resetSurvey = () => {
  csvData.value = [];
  columnNames.value = [];
  selectedFile.value = null;
  selectedFileName.value = '';
  displayColumn.value = '';
  uuidColumn.value = '';
  surveyGenerated.value = false;
  surveyModel.value = null;
  autoRestored.value = false;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const loadResponses = () => {
  fetch('/api/survey')
    .then(res => res.json())
    .then(data => {
      responses.value = data.responses || [];
    })
    .catch(error => {
      console.error('Error loading responses:', error);
    });
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  loadResponses();
  
  // Auto-restore last CSV from localStorage (with SSR guard)
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  
  const savedCsvData = localStorage.getItem('lastCsvData');
  const savedCsvColumns = localStorage.getItem('lastCsvColumns');
  
  if (savedCsvData && savedCsvColumns) {
    try {
      const parsedData = JSON.parse(savedCsvData);
      const parsedColumns = JSON.parse(savedCsvColumns);
      
      if (parsedData.length > 0 && parsedColumns.length > 0) {
        csvData.value = parsedData;
        columnNames.value = parsedColumns;
        autoRestored.value = true;
        
        // Restore column preferences
        const savedDisplayCol = localStorage.getItem('csvDisplayColumn');
        const savedUuidCol = localStorage.getItem('csvUuidColumn');
        
        if (savedDisplayCol && parsedColumns.includes(savedDisplayCol)) {
          displayColumn.value = savedDisplayCol;
        } else {
          displayColumn.value = parsedColumns[0];
        }
        
        if (savedUuidCol && parsedColumns.includes(savedUuidCol)) {
          uuidColumn.value = savedUuidCol;
        } else {
          // Smart UUID detection
          const uuidGuess = parsedColumns.find(col => 
            col.toLowerCase().includes('uuid') || 
            col.toLowerCase().includes('id')
          );
          uuidColumn.value = uuidGuess || parsedColumns[parsedColumns.length > 1 ? 1 : 0];
        }
      }
    } catch (e) {
      console.error('Error restoring CSV data:', e);
      // Clear corrupted data
      localStorage.removeItem('lastCsvData');
      localStorage.removeItem('lastCsvColumns');
    }
  }
});
</script>

<style scoped>
.csv-survey-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #1ab394;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 14px;
}

.upload-section {
  background: #f8f9fa;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin-bottom: 30px;
}

.file-input-wrapper {
  margin-bottom: 20px;
}

#csvFile {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 12px 24px;
  background: #1ab394;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.file-label:hover {
  background: #159a80;
}

.file-name {
  margin-left: 15px;
  color: #333;
  font-weight: 500;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
  margin-top: 20px;
}

.btn-success:hover {
  background: #218838;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.column-selector {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
}

.column-selector h3 {
  color: #333;
  margin-bottom: 20px;
}

.selector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.selector-item label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.selector-item small {
  display: block;
  color: #666;
  margin-top: 5px;
  font-size: 12px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.preview-data {
  margin-bottom: 20px;
}

.preview-data h4 {
  color: #333;
  margin-bottom: 15px;
  font-size: 16px;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}

.table thead {
  background: #f8f9fa;
}

.table th,
.table td {
  padding: 10px;
  text-align: left;
  border: 1px solid #ddd;
}

.table-striped tbody tr:nth-child(odd) {
  background: #f9f9f9;
}

.survey-section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
}

.survey-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.survey-header h3 {
  color: #333;
  margin: 0;
}

#surveyContainer {
  margin-top: 20px;
}

.responses-section {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 30px;
}

.responses-section h3 {
  color: #333;
  margin-bottom: 20px;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.response-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  background: #f9f9f9;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.response-header strong {
  color: #1ab394;
  font-size: 16px;
}

.timestamp {
  color: #666;
  font-size: 12px;
}

.alert {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  position: relative;
}

.alert-error {
  background: #fff5f5;
  border: 1px solid #fc8181;
  color: #c53030;
}

.alert-success {
  background: #f0fff4;
  border: 1px solid #68d391;
  color: #22543d;
}

.alert-info {
  background: #ebf8ff;
  border: 1px solid #63b3ed;
  color: #2c5282;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.alert-content p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: inherit;
  opacity: 0.6;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

.response-meta {
  margin-bottom: 8px;
}

.response-meta small {
  color: #888;
  font-size: 11px;
}

.response-data pre {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin: 0;
  font-size: 12px;
  overflow-x: auto;
}
</style>
