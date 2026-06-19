import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useSubmitFeedback,
  useListFeedback,
  getListFeedbackQueryKey,
} from "@workspace/api-client-react";
import type { PredictionResult } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const feedbackSchema = z.object({
  actual_severity: z.enum(["Low", "Medium", "High"]),
  actual_police_deployed: z.coerce.number().int().min(0),
  diversion_used: z.enum(["Yes", "No", "Partial"]),
  notes: z.string().optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

interface FeedbackLogTabProps {
  lastPrediction: PredictionResult | null;
}

export default function FeedbackLogTab({ lastPrediction }: FeedbackLogTabProps) {
  const queryClient = useQueryClient();
  const { data: feedbackList, isLoading } = useListFeedback();
  const submitFeedback = useSubmitFeedback({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeedbackQueryKey() });
        form.reset();
      },
    },
  });

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      actual_severity: "Medium",
      actual_police_deployed: 0,
      diversion_used: "No",
      notes: "",
    },
  });

  function onSubmit(values: FeedbackForm) {
    submitFeedback.mutate({
      data: {
        predicted_score: lastPrediction?.severity_score ?? 0,
        predicted_band: (lastPrediction?.severity_band as any) ?? "Low",
        actual_severity: values.actual_severity,
        actual_police_deployed: values.actual_police_deployed,
        diversion_used: values.diversion_used,
        notes: values.notes ?? null,
      },
    });
  }

  const bandColor = (band: string) =>
    band === "High"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : band === "Medium"
      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
      : "bg-green-500/20 text-green-400 border-green-500/30";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-muted-foreground">
          Submit Post-Event Feedback
        </h2>

        {lastPrediction ? (
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/40 border border-border">
            <span className="text-xs text-muted-foreground font-mono">Last Prediction:</span>
            <span className="text-sm font-bold">{lastPrediction.severity_score.toFixed(0)}/100</span>
            <Badge className={`text-xs border ${bandColor(lastPrediction.severity_band)}`} variant="outline">
              {lastPrediction.severity_band}
            </Badge>
          </div>
        ) : (
          <div className="p-3 rounded-md bg-muted/40 border border-dashed border-border text-xs text-muted-foreground font-mono">
            No prediction made yet. Run a prediction first.
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actual_severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Actual Severity
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-actual-severity">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actual_police_deployed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Actual Police Deployed
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      data-testid="input-police-deployed"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diversion_used"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Diversion Used
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-diversion-used">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Notes (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Any observations..."
                      data-testid="textarea-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full font-mono uppercase tracking-wider"
              disabled={submitFeedback.isPending}
              data-testid="button-submit-feedback"
            >
              {submitFeedback.isPending ? "Saving..." : "Submit Feedback"}
            </Button>
          </form>
        </Form>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-muted-foreground">
          Feedback Log
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !feedbackList || feedbackList.length === 0 ? (
          <div className="text-xs text-muted-foreground font-mono py-8 text-center border border-dashed border-border rounded-md">
            No feedback submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                  <th className="text-left pb-2 pr-3">ID</th>
                  <th className="text-left pb-2 pr-3">Pred Score</th>
                  <th className="text-left pb-2 pr-3">Pred Band</th>
                  <th className="text-left pb-2 pr-3">Actual</th>
                  <th className="text-left pb-2 pr-3">Police</th>
                  <th className="text-left pb-2 pr-3">Diversion</th>
                  <th className="text-left pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feedbackList.map((fb) => (
                  <tr key={fb.id} data-testid={`row-feedback-${fb.id}`} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2 pr-3 text-muted-foreground">{fb.id}</td>
                    <td className="py-2 pr-3">{Number(fb.predicted_score).toFixed(0)}</td>
                    <td className="py-2 pr-3">
                      <Badge className={`text-xs border ${bandColor(fb.predicted_band)}`} variant="outline">
                        {fb.predicted_band}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge className={`text-xs border ${bandColor(fb.actual_severity)}`} variant="outline">
                        {fb.actual_severity}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{fb.actual_police_deployed}</td>
                    <td className="py-2 pr-3">{fb.diversion_used}</td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
