<script lang="ts" setup>
import { SurveyCreatorModel } from 'survey-creator-core';
import PipeAutocomplete from './PipeAutocomplete.vue';

const creator = new SurveyCreatorModel({ pageEditMode: "bypage", showLogicTab: true, showJSONEditorTab: true, showTranslationTab: true, showThemeTab: true });
creator.toolbox.searchEnabled = false;
creator.toolbox.overflowBehavior = "hideInMenu";
creator.expandCollapseButtonVisibility = "onhover";

// Enable dynamic text expressions in page titles and descriptions
creator.survey.onTextMarkdown.add((survey, options) => {
  options.html = options.text;
});

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
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh">
        <SurveyCreatorComponent :model="creator"></SurveyCreatorComponent>
        <PipeAutocomplete :creator="creator" />
    </div>
</template>