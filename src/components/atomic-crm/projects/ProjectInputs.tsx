import { required } from "ra-core";
import { TextInput } from "@/components/admin/text-input";

export const ProjectInputs = () => (
  <div className="flex flex-col gap-4">
    <TextInput source="name" validate={required()} helperText={false} />
    <TextInput source="description" multiline rows={3} helperText={false} />
  </div>
);
