import { useMemo } from "react";
import { useStore } from "ra-core";

import type { DealStage, LabeledValue, LeaveType, NoteStatus } from "../types";
import { defaultConfiguration } from "./defaultConfiguration";

export const CONFIGURATION_STORE_KEY = "app.configuration";

export interface ConfigurationContextValue {
  companySectors: LabeledValue[];
  currency: string;
  dealCategories: LabeledValue[];
  dealPipelineStatuses: string[];
  dealStages: DealStage[];
  issueStatuses: LabeledValue[];
  issuePriorities: LabeledValue[];
  noteStatuses: NoteStatus[];
  taskTypes: LabeledValue[];
  departments: LabeledValue[];
  designations: LabeledValue[];
  employmentTypes: LabeledValue[];
  employeeStatuses: LabeledValue[];
  leaveTypes: LeaveType[];
  title: string;
  darkModeLogo: string;
  lightModeLogo: string;
}

export const useConfigurationContext = () => {
  const [config] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
    defaultConfiguration,
  );
  // Merge with defaults so that missing fields in stored config
  // fall back to default values (e.g. when new settings are added)
  return useMemo(() => ({ ...defaultConfiguration, ...config }), [config]);
};

export const useConfigurationUpdater = () => {
  const [, setConfig] = useStore<ConfigurationContextValue>(
    CONFIGURATION_STORE_KEY,
  );
  return setConfig;
};
