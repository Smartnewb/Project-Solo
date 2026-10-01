"use client";
import { Tabs } from "@heroui/react";
import {
  FlaskConical as ScienceIcon,
  Camera as PhotoCameraIcon,
} from "lucide-react";

import { useState, useEffect } from "react";

import VisionPhotoTestTab from "./components/VisionPhotoTestTab";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lab-tabpanel-${index}`}
      aria-labelledby={`lab-tab-${index}`}
      {...other}
    >
      {value === index && <div style={{ paddingTop: 24 }}>{children}</div>}
    </div>
  );
};

function LabPageContent() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div style={{ padding: 24 }}>
      <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ScienceIcon size={16} />
        실험실
      </h4>
      <div
        style={{
          borderBottom: "1px solid #e4e4e7",
          borderColor: "#e4e4e7",
          marginBottom: 16,
        }}
      >
        <Tabs
          selectedKey={tabValue}
          onSelectionChange={(key) =>
            handleTabChange({} as React.SyntheticEvent, Number(key))
          }
        >
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id={0}>
                {"VISION 프로필 심사"}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      <TabPanel value={tabValue} index={0}>
        <VisionPhotoTestTab />
      </TabPanel>
    </div>
  );
}

export default function LabV2() {
  return <LabPageContent />;
}
