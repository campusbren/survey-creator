<template>
  <div v-if="isOpen" class="csv-import-overlay">
    <div class="csv-import-panel">
      <div class="panel-header">
        <h3>Import Answer Choices from CSV</h3>
        <button @click="close" class="close-btn">✕</button>
      </div>

      <div class="panel-body">
        <div v-if="!csvData.length" class="upload-section">
          <input 
            type="file" 
            id="csvImport" 
            accept=".csv" 
            @change="handleFileSelect"
            class="file-input"
          />
          <label for="csvImport" class="file-label">
            📁 Choose CSV File
          </label>
        </div>

        <div v-if="csvData.length && !selectedColumns" class="column-selector">
          <h4>Select Columns</h4>
          <div class="selector-row">
            <div class="selector-item">
              <label>Display Text Column:</label>
              <select v-model="displayCol" class="form-control">
                <option value="">Select...</option>
                <option v-for="col in columnNames" :key="col" :value="col">
                  {{ col }}
                </option>
              </select>
            </div>
            <div class="selector-item">
              <label>Value (UUID) Column:</label>
              <select v-model="valueCol" class="form-control">
                <option value="">Select...</option>
                <option v-for="col in columnNames" :key="col" :value="col">
                  {{ col }}
                </option>
              </select>
            </div>
          </div>
          <button @click="confirmColumns" class="btn btn-primary" :disabled="!displayCol || !valueCol">
            Next
          </button>
          <button @click="resetUpload" class="btn btn-secondary">
            Upload Different File
          </button>
        </div>

        <div v-if="selectedColumns" class="preview-section">
          <h4>Preview (First 5 rows)</h4>
          <div class="table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Display Text</th>
                  <th>Value (UUID)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in csvData.slice(0, 5)" :key="idx">
                  <td>{{ row[displayCol] }}</td>
                  <td>{{ row[valueCol] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button @click="importChoices" class="btn btn-success">
            ✓ Import as Answer Choices
          </button>
          <button @click="resetUpload" class="btn btn-secondary">
            Upload Different File
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Papa from 'papaparse';

const props = defineProps<{
  isOpen: boolean;
  onImport: (choices: Array<{ value: string; text: string }>) => void;
}>();

const emit = defineEmits<{
  close: [];
}>();

const csvData = ref<any[]>([]);
const columnNames = ref<string[]>([]);
const displayCol = ref('');
const valueCol = ref('');
const selectedColumns = ref(false);

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      csvData.value = results.data as any[];
      columnNames.value = results.meta.fields || [];
    },
    error: (error) => {
      alert('Error parsing CSV: ' + error.message);
    }
  });
};

const confirmColumns = () => {
  selectedColumns.value = true;
};

const resetUpload = () => {
  csvData.value = [];
  columnNames.value = [];
  displayCol.value = '';
  valueCol.value = '';
  selectedColumns.value = false;
};

const importChoices = () => {
  const choices = csvData.value.map(row => ({
    value: row[valueCol.value],
    text: row[displayCol.value]
  }));
  props.onImport(choices);
  emit('close');
  resetUpload();
};

const close = () => {
  emit('close');
  resetUpload();
};
</script>

<style scoped>
.csv-import-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.csv-import-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.panel-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.panel-body {
  padding: 20px;
  overflow-y: auto;
}

.upload-section {
  text-align: center;
  padding: 40px 20px;
}

#csvImport {
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
}

.file-label:hover {
  background: #159a80;
}

.column-selector,
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.column-selector h4,
.preview-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.selector-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.selector-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.selector-item label {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.form-control {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.table-wrapper {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto;
  margin: 10px 0;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  padding: 8px;
  text-align: left;
  border: 1px solid #ddd;
}

.preview-table thead {
  background: #f5f5f5;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
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
</style>
