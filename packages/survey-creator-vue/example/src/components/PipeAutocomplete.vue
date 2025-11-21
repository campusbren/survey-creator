<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from 'vue';

const props = defineProps({
  creator: {
    type: Object,
    required: true
  }
});

const showPanel = ref(true);
const focusedInput = ref(null);
const searchText = ref('');
const panelContainer = ref(null);
const isInserting = ref(false);

const availableFields = computed(() => {
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

const filteredFields = computed(() => {
  if (!searchText.value) return availableFields.value;
  const search = searchText.value.toLowerCase();
  return availableFields.value.filter(f => f.toLowerCase().includes(search));
});

const isInsidePanel = (target) => {
  // Check if the target or any parent is inside the panel
  let el = target;
  while (el && el !== document) {
    if (el === panelContainer.value) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
};

const setupFocusTracking = () => {
  // Track which input has focus using focusin (bubbles better than focus)
  const trackFocus = (e) => {
    // Skip tracking if we're in the middle of inserting
    if (isInserting.value) return;
    
    // Don't update if clicking inside the Field Piping panel
    if (isInsidePanel(e.target)) return;
    
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      focusedInput.value = e.target;
      searchText.value = '';
    }
  };

  // Use focusin which bubbles and works better in nested contexts
  document.addEventListener('focusin', trackFocus);
  
  // Also track click events on inputs as fallback
  const trackClick = (e) => {
    // Skip tracking if we're in the middle of inserting
    if (isInserting.value) return;
    
    // Don't update if clicking inside the Field Piping panel
    if (isInsidePanel(e.target)) return;
    
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      focusedInput.value = e.target;
      searchText.value = '';
    }
  };
  
  document.addEventListener('click', trackClick, true);

  return () => {
    document.removeEventListener('focusin', trackFocus);
    document.removeEventListener('click', trackClick, true);
  };
};

onMounted(async () => {
  setupFocusTracking();
  
  // Wait for DOM to be ready
  await nextTick();
  
  // Prevent SurveyJS from closing the active editor when clicking the panel
  // SurveyJS has global pointerdown listeners that close editors on "outside" clicks
  if (panelContainer.value) {
    console.log('Field Piping panel: Adding event listeners to prevent SurveyJS editor closure');
    
    panelContainer.value.addEventListener('pointerdown', (e) => {
      console.log('Field Piping panel: pointerdown event, stopping propagation');
      // Stop the event from reaching SurveyJS' global handlers
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true); // Use capture phase
    
    panelContainer.value.addEventListener('mousedown', (e) => {
      console.log('Field Piping panel: mousedown event, stopping propagation');
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true); // Use capture phase
    
    panelContainer.value.addEventListener('click', (e) => {
      console.log('Field Piping panel: click event, stopping propagation');
      // Also stop click events
      e.stopPropagation();
      e.stopImmediatePropagation();
    }, true); // Use capture phase
  } else {
    console.error('Field Piping panel: panelContainer.value is null!');
  }
});

const insertField = (e, fieldName) => {
  console.log('insertField called for:', fieldName);
  console.log('focusedInput.value:', focusedInput.value);
  console.log('document.activeElement:', document.activeElement);
  
  // Prevent button from getting focus
  e.preventDefault();
  
  // Get the input that was active before the button was clicked
  let input = focusedInput.value;
  
  // Fallback: check if there's an active input element
  if (!input) {
    const activeEl = document.activeElement;
    console.log('activeEl tagName:', activeEl?.tagName);
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      input = activeEl;
      console.log('Using activeElement as input');
    }
  }
  
  if (!input) {
    console.error('No input field found! focusedInput.value and activeElement both failed');
    alert('Click on a text input field first, then select a field to pipe.');
    return;
  }

  console.log('Inserting field into input:', input);
  
  // Mark that we're inserting to prevent focus tracking from interfering
  isInserting.value = true;

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
  
  // Refocus the original input
  input.focus();
  input.selectionStart = input.selectionEnd = startPos + fieldCode.length;
  
  console.log('Field inserted successfully');
  
  // Re-enable focus tracking after everything settles
  setTimeout(() => {
    isInserting.value = false;
  }, 50);
};
</script>

<template>
  <div ref="panelContainer" v-if="showPanel" style="
    position: fixed;
    top: 10px;
    right: 10px;
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
        tabindex="-1"
        @mousedown="insertField($event, field)"
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
