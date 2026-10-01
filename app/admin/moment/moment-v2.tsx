"use client";
import { Tabs } from "@heroui/react";

import { useState, useEffect } from "react";

import QuestionGenerationTab from "./components/QuestionGenerationTab";
import QuestionListTab from "./components/QuestionListTab";
import QuestionTranslationTab from "./components/QuestionTranslationTab";

type TabValue = "generation" | "list" | "translation";

function MomentManagementPageContent() {
  const [tabValue, setTabValue] = useState<TabValue>("list");

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
  };

  return (
    <div>
      <h5 style={{ marginBottom: 24 }}>모먼트 관리</h5>
      <Tabs
        selectedKey={tabValue}
        onSelectionChange={(key) =>
          handleTabChange({} as React.SyntheticEvent, String(key) as any)
        }
        style={{ marginBottom: 24 }}
      >
        <Tabs.ListContainer>
          <Tabs.List>
            <Tabs.Tab id={"list"}>
              {"질문 목록"}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id={"generation"}>
              {"질문 생성"}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id={"translation"}>
              {"질문 번역"}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      {tabValue === "list" && <QuestionListTab />}
      {tabValue === "generation" && <QuestionGenerationTab />}
      {tabValue === "translation" && <QuestionTranslationTab />}
    </div>
  );
}

export default function MomentManagementV2() {
  return <MomentManagementPageContent />;
}
