<script lang="ts" setup>
import { SurveyCreatorModel } from 'survey-creator-core';
import { ref, provide, onMounted } from 'vue';
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

// Add "Show Fields" button to the top toolbar (left sidebar not possible with current SurveyJS API)
const fieldPipingAction = new Action({
  id: "show-fields",
  title: "🔗 Show Fields",
  tooltip: "Insert field references (piping)",
  visible: true,
  action: () => {
    showFieldPiping.value = !showFieldPiping.value;
    console.log('Show Fields toggled, showFieldPiping:', showFieldPiping.value);
  }
});

creator.toolbar.actions.push(fieldPipingAction);

// Provide close function for FieldPipingSidebar
provide('closeFieldPiping', () => {
  showFieldPiping.value = false;
  console.log('Field Piping Sidebar closed');
});

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
creator.onPropertyChanged.add((sender: any, options: any) => {
  if (options.name === 'selectedElement') {
    const element = sender.selectedElement;
    canImportCsv.value = !!(element && 'choices' in element);
  }
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

import { SurveyCreatorComponent } from "survey-creator-vue";

// Load sample survey after component is mounted
onMounted(() => {
  creator.JSON = sampleSurvey;
  console.log('✓ Sample survey loaded with', sampleSurvey.pages.length, 'pages and', sampleSurvey.pages[0].elements.length, 'elements on page 1');
  console.log('Creator JSON:', creator.JSON);
});

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
  console.log('✓ Answer choices imported successfully!', (element as any).choices);
  alert('✓ Answer choices imported! (' + choices.length + ' items)');
};
</script>
<template>
    <div class="creator-host">
        <div class="creator-wrapper">
          <SurveyCreatorComponent :model="creator"></SurveyCreatorComponent>
        </div>
        
        <!-- Show Fields Sidebar Content -->
        <FieldPipingSidebar 
          v-if="showFieldPiping"
          :creator="creator" 
          :isOpen="true"
        />

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
</style>