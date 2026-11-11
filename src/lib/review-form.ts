export interface ReviewState {
  status: "idle" | "done" | "invalid" | "limited" | "failed";
  errors: Partial<Record<"name" | "rating" | "body", true>>;
  values: { name: string; rating: string; title: string; body: string };
}

export const REVIEW_IDLE: ReviewState = {
  status: "idle",
  errors: {},
  values: { name: "", rating: "", title: "", body: "" },
};
