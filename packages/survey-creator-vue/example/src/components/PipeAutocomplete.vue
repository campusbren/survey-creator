<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  creator: {
    type: Object,
    required: true
  }
});

const showPanel = ref(true);
const focusedInput = ref(null);
const searchText = ref('');
const refreshKey = ref(0);

const availableFields = computed(() => {
  // Include refreshKey in dependency to trigger updates
  refreshKey.value;
  
  const fields = [];
  if (props.creator.survey && props.creator.survey.pages) {
    props.creator.survey.pages.forEach(page => {
      if (page.elements) {
        page.elements.forEach(element => {
          if (element.name) {
            fields.push(element.name);
          }
        });
      }
    });
  }
  return [...new Set(fields)].sort();
});

// Watch for changes in survey pages array
watch(
  () => props.creator.survey?.pages,
  () => {
    refreshKey.value++;
  },
  { deep: true }
);

// Also watch for changes to individual page elements
watch(
  () => props.creator.survey?.pages?.flatMap(p => p.elements),
  () => {
    refreshKey.value++;
  },
  { deep: true }
);

const filteredFields = computed(() => {
  if (!searchText.value) return availableFields.value;
  const search = searchText.value.toLowerCase();
  return availableFields.value.filter(f => f.toLowerCase().includes(search));
});

let focusObserver = null;

const setupFocusTracking = () => {
  // Track which input has focus
  const trackFocus = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      focusedInput.value = e.target;
      searchText.value = '';
    }
  };

  document.addEventListener('focus', trackFocus, true);

  return () => {
    document.removeEventListener('focus', trackFocus, true);
  };
};

onMounted(() => {
  setupFocusTracking();
});

const insertField = (fieldName) => {
  if (!focusedInput.value) {
    alert('Click on a text input field first, then select a field to pipe.');
    return;
  }

  const input = focusedInput.value;
  const startPos = input.selectionStart || 0;
  const endPos = input.selectionEnd || 0;
  const text = input.value;

  const fieldCode = `{${fieldName}}`;
  const newText = text.substring(0, startPos) + fieldCode + text.substring(endPos);
  
  input.value = newText;
  input.selectionStart = input.selectionEnd = startPos + fieldCode.length;
  
  // Trigger input event so SurveyJS detects the change
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  focusedInput.value.focus();
};
</script>

<template>
  <div v-if="showPanel" style="
    position: fixed;
    top: 10px;
    left: 10px;
    background: white;
    border: 2px solid #1ab394;
    border-radius: 6px;
    padding: 15px;
    width: 280px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  ">
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    ">
      <h3 style="
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      ">
        📌 Field Piping
      </h3>
      <button 
        @click="showPanel = false"
        style="
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: #999;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        ✕
      </button>
    </div>

    <input 
      v-model="searchText"
      type="text"
      placeholder="Search fields..."
      style="
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        margin-bottom: 10px;
        box-sizing: border-box;
      "
    />

    <div v-if="filteredFields.length === 0" style="
      color: #999;
      font-size: 12px;
      padding: 10px;
      text-align: center;
    ">
      {{ availableFields.length === 0 ? 'No fields yet' : 'No matches' }}
    </div>

    <div v-else style="
      flex: 1;
      overflow-y: auto;
      border-top: 1px solid #f0f0f0;
      padding-top: 8px;
    ">
      <button
        v-for="field in filteredFields"
        :key="field"
        @click="insertField(field)"
        style="
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          margin-bottom: 4px;
          background: #f9f9f9;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-family: monospace;
          color: #333;
          transition: all 0.15s ease;
          box-sizing: border-box;
        "
        @mouseenter="$event.target.style.backgroundColor = '#e8f4f8'; $event.target.style.borderColor = '#1ab394';"
        @mouseleave="$event.target.style.backgroundColor = '#f9f9f9'; $event.target.style.borderColor = '#e8e8e8';"
      >
        <span v-text="'{' + field + '}'"></span>
      </button>
    </div>

    <div style="
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f0f0f0;
      font-size: 11px;
      color: #999;
      line-height: 1.4;
    ">
      <strong>How to use:</strong><br>
      1. Click a text field to edit<br>
      2. Click a field name below<br>
      3. It inserts {fieldName}
    </div>
  </div>

  <button 
    v-if="!showPanel"
    @click="showPanel = true"
    style="
      position: fixed;
      top: 10px;
      left: 10px;
      background: #1ab394;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    "
  >
    📌 Show Fields
  </button>
</template>
