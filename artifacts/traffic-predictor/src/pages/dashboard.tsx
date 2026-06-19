import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PredictionResult } from "@workspace/api-client-react";
import { Activity, Map as MapIcon, BarChart2, MessageSquare } from "lucide-react";
import PredictImpactTab from "@/components/tabs/predict-impact";
import HistoricalAnalysisTab from "@/components/tabs/historical-analysis";
import ZoneMapTab from "@/components/tabs/zone-map";
import FeedbackLogTab from "@/components/tabs/feedback-log";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("predict");
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground dark">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-md border border-primary/30">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Event Traffic Impact Predictor</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-mono">Bangalore Gridlock Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-mono text-green-500">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
            <TabsTrigger value="predict" className="font-mono text-xs uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5 mr-2" />
              Predict
            </TabsTrigger>
            <TabsTrigger value="history" className="font-mono text-xs uppercase tracking-wider">
              <BarChart2 className="h-3.5 w-3.5 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="map" className="font-mono text-xs uppercase tracking-wider">
              <MapIcon className="h-3.5 w-3.5 mr-2" />
              Zone Map
            </TabsTrigger>
            <TabsTrigger value="feedback" className="font-mono text-xs uppercase tracking-wider">
              <MessageSquare className="h-3.5 w-3.5 mr-2" />
              Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predict" className="mt-0">
            <PredictImpactTab onPrediction={setLastPrediction} lastPrediction={lastPrediction} />
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            <HistoricalAnalysisTab />
          </TabsContent>
          <TabsContent value="map" className="mt-0" style={{ height: "calc(100vh - 200px)" }}>
            <ZoneMapTab lastPrediction={lastPrediction} />
          </TabsContent>
          <TabsContent value="feedback" className="mt-0">
            <FeedbackLogTab lastPrediction={lastPrediction} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
