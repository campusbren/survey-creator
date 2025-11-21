<template>
  <!-- Expanded Sidebar (no collapsed button - it's in the property grid now) -->
  <div v-if="isOpen" class="field-piping-sidebar">
    <div class="sidebar-header">
      <div class="header-content">
        <h3>🔗 Show Fields</h3>
        <button @click="toggleFields" class="toggle-button" :title="fieldsVisible ? 'Hide Fields' : 'Show Fields'">
          {{ fieldsVisible ? '−' : '+' }}
        </button>
        <button @click="handleClose" class="close-button" title="Close">✕</button>
      </div>
      <p class="sidebar-description">Insert dynamic field references into your text</p>
    </div>

    <div v-if="fieldsVisible" class="search-box">
      <input
        v-model="searchText"
        type="text"
        placeholder="Search fields..."
        class="field-search"
      />
    </div>

    <div v-if="fieldsVisible && filteredFields.length > 0" class="fields-list">
      <div
        v-for="field in filteredFields"
        :key="field"
        class="field-item"
        @click="insertField(field)"
      >
        <span class="field-name">{<span>{{ field }}</span>}</span>
        <span class="insert-hint">Click to insert</span>
      </div>
    </div>

    <div v-if="fieldsVisible && availableFields.length === 0" class="no-fields">
      <p>No fields available yet. Add questions to your survey to see them here.</p>
    </div>

    <div v-if="fieldsVisible && availableFields.length > 0 && filteredFields.length === 0" class="no-fields">
      <p>No fields match your search.</p>
    </div>

    <div v-if="fieldsVisible" class="usage-help">
      <strong>How to use:</strong>
      <ol>
        <li>Click a text field in your survey to edit it</li>
        <li>Click a field name above to insert it</li>
        <li>The field will show as <code>{fieldName}</code></li>
      </ol>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';

const props = defineProps({
  creator: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

// Inject the close function from parent
const closeFieldPiping = inject<() => void>('closeFieldPiping');

const fieldsVisible = ref(true);
const searchText = ref('');
const focusedInput = ref(null);

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

const toggleFields = () => {
  fieldsVisible.value = !fieldsVisible.value;
};

const handleClose = () => {
  if (closeFieldPiping) {
    closeFieldPiping();
  } else {
    console.error('closeFieldPiping function not found - provide/inject may not be working');
  }
};

const isEditableElement = (el) => {
  if (!el) return false;
  
  // Standard input/textarea
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return true;
  
  // SurveyJS uses contenteditable SPAN elements
  if (el.contentEditable === 'true' || el.getAttribute('contenteditable') === 'true') {
    return true;
  }
  
  // Also check for role="textbox" (SurveyJS editors have this)
  if (el.getAttribute('role') === 'textbox') return true;
  
  return false;
};

const setupFocusTracking = () => {
  const trackFocus = (e) => {
    if (isEditableElement(e.target)) {
      console.log('Field Piping: Tracked focus on', e.target);
      focusedInput.value = e.target;
    }
  };

  document.addEventListener('focusin', trackFocus);
  document.addEventListener('click', trackFocus, true);

  return () => {
    document.removeEventListener('focusin', trackFocus);
    document.removeEventListener('click', trackFocus, true);
  };
};

const insertField = (fieldName) => {
  console.log('insertField called with:', fieldName);
  console.log('focusedInput.value:', focusedInput.value);
  
  if (!focusedInput.value) {
    alert('Please click inside a text field first (in the Designer tab, click on a question, then click in the "Question title" or "Description" field in the property panel on the right).');
    return;
  }

  const text = `{${fieldName}}`;
  const target = focusedInput.value;
  console.log('Attempting to insert:', text, 'into:', target);

  // For contenteditable elements (SurveyJS uses these)
  if (target.contentEditable === 'true' || target.getAttribute('contenteditable') === 'true') {
    const selection = window.getSelection();
    
    // If there's a selection range in the document
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Create a text node with the field reference
      const textNode = document.createTextNode(text);
      
      // Insert the text node at the current cursor position
      range.deleteContents();
      range.insertNode(textNode);
      
      // Move cursor after the inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input event so SurveyJS knows the content changed
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.focus();
      
      console.log('Inserted field via Selection API:', text);
    } else {
      // Fallback: append to the end
      target.textContent = (target.textContent || '') + text;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.focus();
    }
  } 
  // For standard input/textarea elements
  else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const currentValue = target.value || '';
    
    target.value = currentValue.substring(0, start) + text + currentValue.substring(end);
    target.selectionStart = target.selectionEnd = start + text.length;
    
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.focus();
    
    console.log('Inserted field into input:', text);
  }
};

let cleanupFocusTracking;

onMounted(() => {
  cleanupFocusTracking = setupFocusTracking();
  console.log('Field Piping Sidebar: Focus tracking enabled');
});

onUnmounted(() => {
  if (cleanupFocusTracking) {
    cleanupFocusTracking();
  }
});
</script>

<style scoped>
.show-fields-icon {
  position: fixed;
  width: 48px;
  height: 48px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.show-fields-icon:hover {
  background: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.field-piping-sidebar {
  position: fixed;
  top: 65px;
  right: 0;
  width: 320px;
  height: calc(100vh - 65px);
  padding: 16px;
  background: #fafafa;
  border-left: 1px solid #e7e7e7;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 1000;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f0f0f0;
  color: #333;
}

.sidebar-description {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.search-box {
  width: 100%;
}

.field-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.field-search:focus {
  outline: none;
  border-color: #1ab394;
}

.fields-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-item:hover {
  background: #f0f9f7;
  border-color: #1ab394;
  box-shadow: 0 2px 4px rgba(26, 179, 148, 0.1);
}

.field-name {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #1ab394;
  font-weight: 600;
}

.insert-hint {
  font-size: 11px;
  color: #999;
  opacity: 0;
  transition: opacity 0.2s;
}

.field-item:hover .insert-hint {
  opacity: 1;
}

.no-fields {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.no-fields p {
  margin: 0;
}

.usage-help {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  margin-top: auto;
}

.usage-help strong {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.usage-help ol {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.usage-help li {
  margin-bottom: 4px;
}

.usage-help code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #1ab394;
}
</style>
