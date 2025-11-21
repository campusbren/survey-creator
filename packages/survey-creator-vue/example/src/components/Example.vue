<script lang="ts" setup>
import { SurveyCreatorModel } from 'survey-creator-core';
import { ref } from 'vue';
import { Action } from 'survey-core';
import FieldPipingSidebar from './FieldPipingSidebar.vue';
import CsvImportPanel from './CsvImportPanel.vue';

const creator = new SurveyCreatorModel({ pageEditMode: "bypage", showLogicTab: true, showJSONEditorTab: true, showTranslationTab: true, showThemeTab: true });
creator.toolbox.searchEnabled = false;
creator.toolbox.overflowBehavior = "hideInMenu";
creator.expandCollapseButtonVisibility = "onhover";

const showFieldPiping = ref(false);
const showCsvImport = ref(false);
const canImportCsv = ref(false);

// Add CSV Import toolbar button - only visible when question has choices
const csvImportAction = new Action({
  id: "import-csv",
  title: "Import CSV",
  tooltip: "Import Answer Choices from CSV",
  iconName: "icon-attachment",
  css: "sv-action-bar-item",
  get visible() { return canImportCsv.value; },
  action: () => {
    showCsvImport.value = true;
  }
});

creator.toolbar.actions.push(csvImportAction);

// Monitor for when user selects a question with choices
creator.onPropertyChanged.add((sender, options) => {
  if (options.name === 'selectedElement') {
    const element = sender.selectedElement;
    canImportCsv.value = !!(element && 'choices' in element);
  }
});

// Enable dynamic text expressions in page titles and descriptions
creator.survey.onTextMarkdown.add((survey, options) => {
  options.html = options.text;
});

// Add CSS for rating labels positioned below
const style = document.createElement('style');
style.textContent = `
  .sv-q-rating.rating-labels-below .sv-q-rating-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }
  
  .sv-q-rating.rating-labels-below .sv-q-rating-item-text {
    order: 2;
    font-size: 12px;
    margin-top: 4px;
    white-space: normal;
    width: 100%;
  }
  
  .sv-q-rating.rating-labels-below .sv-q-rating-item-content {
    order: 1;
  }
`;
document.head.appendChild(style);

// Initialize with a sample survey demonstrating page title piping
const sampleSurvey = {
  pages: [
    {
      name: "page1",
      title: "Personal Information",
      elements: [
        {
          type: "text",
          name: "firstName",
          title: "What is your first name?",
          isRequired: true
        },
        {
          type: "text",
          name: "lastName",
          title: "What is your last name?",
          isRequired: true
        }
      ]
    },
    {
      name: "page2",
      title: "Experience for {firstName}",
      description: "Now let's learn about {firstName} {lastName}'s experience",
      elements: [
        {
          type: "text",
          name: "jobTitle",
          title: "What is {firstName}'s job title?"
        },
        {
          type: "text",
          name: "company",
          title: "What company does {firstName} work for?"
        },
        {
          type: "rating",
          name: "jobSatisfaction",
          title: "How satisfied are you with this role?",
          rateCount: 5,
          choices: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"],
          cssClasses: {
            root: "rating-labels-below"
          }
        }
      ]
    },
    {
      name: "page3",
      title: "Additional Info for {jobTitle}",
      description: "Based on your role as {jobTitle} at {company}, please provide additional details.",
      elements: [
        {
          type: "text",
          name: "yearsExperience",
          title: "Years of experience in {jobTitle}?"
        }
      ]
    }
  ]
};

creator.survey.fromJSON(sampleSurvey);

import { SurveyCreatorComponent } from "survey-creator-vue";

const handleCsvImport = (choices: Array<{ value: string; text: string }>) => {
  console.log('Import handler called with choices:', choices);
  console.log('Creator object:', creator);
  
  // Get the selected element - try different approaches
  let element = null;
  
  // Approach 1: Direct selectedElement property
  if ((creator as any).selectedElement) {
    element = (creator as any).selectedElement;
    console.log('Found via creator.selectedElement');
  }
  // Approach 2: Through survey
  else if ((creator as any).survey?.selectedElement) {
    element = (creator as any).survey.selectedElement;
    console.log('Found via creator.survey.selectedElement');
  }
  // Approach 3: Through viewModel
  else if ((creator as any).viewModel?.selectedElement) {
    element = (creator as any).viewModel.selectedElement;
    console.log('Found via creator.viewModel.selectedElement');
  }
  
  console.log('Selected element:', element);
  
  if (!element) {
    alert('Please select a dropdown, checkbox, or radio button question first');
    return;
  }
  
  // Check if element has choices property
  if (!('choices' in element)) {
    alert('Selected question must be a dropdown, checkbox, or radio button');
    return;
  }
  
  // Update choices
  (element as any).choices = choices;
  console.log('✓ Answer choices imported successfully!', element.choices);
  alert('✓ Answer choices imported! (' + choices.length + ' items)');
};
</script>
<template>
    <div class="creator-host">
        <div class="creator-wrapper">
          <SurveyCreatorComponent :model="creator"></SurveyCreatorComponent>
        </div>
        
        <!-- Show Fields Toggle Button -->
        <button v-if="!showFieldPiping" class="show-fields-button" @click="showFieldPiping = true" title="Show Fields">
          🔗 Show Fields
        </button>
        
        <!-- Field Piping Sidebar (toggleable) -->
        <div v-if="showFieldPiping" class="field-piping-container">
          <FieldPipingSidebar :creator="creator" @close="showFieldPiping = false" />
        </div>

        <!-- CSV Import Panel (modal) - triggered via toolbar when choices panel is active -->
        <CsvImportPanel 
          :isOpen="showCsvImport"
          :onImport="handleCsvImport"
          @close="showCsvImport = false"
        />
        
        <!-- Add Import CSV button to the SurveyJS Creator property grid -->
        <div id="import-csv-button-container"></div>
    </div>
</template>
<style scoped>
.creator-host {
  flex: 1;
  position: relative;
}

.creator-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}

.creator-wrapper :deep(.svc-creator) {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.show-fields-button {
  position: fixed;
  top: 125px;
  right: 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
  color: #1ab394;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.show-fields-button:hover {
  background: #f9f9f9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.field-piping-container {
  position: fixed;
  top: 125px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 150px);
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>