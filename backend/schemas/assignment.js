import { z } from "zod";
import { idField } from "./common.js";

const committeeRole = z.enum(["chair", "member"], { error: "บทบาทกรรมการต้องเป็นประธานหรือกรรมการร่วม" });

export const assignmentSchema = z.object({
  committee_id: idField("กรุณาเลือกกรรมการ"),
  evaluatee_id: idField("กรุณาเลือกผู้รับการประเมิน"),
  committee_role: committeeRole,
});

export const assignmentRoleSchema = z.object({ committee_role: committeeRole });
