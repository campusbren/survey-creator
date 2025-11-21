<script lang="ts" setup>
import { SurveyCreatorModel } from 'survey-creator-core';
import { ref } from 'vue';
import { Action } from 'survey-core';
import FieldPipingSidebar from './FieldPipingSidebar.vue';

const creator = new SurveyCreatorModel({ pageEditMode: "bypage", showLogicTab: true, showJSONEditorTab: true, showTranslationTab: true, showThemeTab: true });
creator.toolbox.searchEnabled = false;
creator.toolbox.overflowBehavior = "hideInMenu";
creator.expandCollapseButtonVisibility = "onhover";

const showFieldPiping = ref(false);

// Add Field Piping toolbar button
const fieldPipingAction = new Action({
  id: "show-field-piping",
  title: "Show Fields",
  tooltip: "Toggle Field Piping Panel",
  iconName: "icon-text",
  css: "sv-action-bar-item",
  visible: true,
  action: () => {
    showFieldPiping.value = !showFieldPiping.value;
    console.log('Field Piping toggled:', showFieldPiping.value);
  }
});

creator.toolbar.actions.push(fieldPipingAction);

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
</script>
<template>
    <div class="creator-host">
        <div class="creator-wrapper">
          <SurveyCreatorComponent :model="creator"></SurveyCreatorComponent>
        </div>
        
        <!-- Field Piping Sidebar (toggleable) -->
        <div v-if="showFieldPiping" class="field-piping-container">
          <FieldPipingSidebar :creator="creator" @close="showFieldPiping = false" />
        </div>
    </div>
</template>
<style scoped>
.creator-host {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1;
  min-height: 0;
}

.creator-wrapper {
  height: 100%;
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