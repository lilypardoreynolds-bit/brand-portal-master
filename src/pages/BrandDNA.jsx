import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Dna, Heart, Users, Target, Lightbulb, Tag, Rocket, Sparkles } from "lucide-react";
import BrandDNAForm from "@/components/branddna/BrandDNAForm";
import BlueprintSection from "@/components/branddna/BlueprintSection";
import BlueprintHeader from "@/components/branddna/BlueprintHeader";

const EMPTY_FORM = {
  brand_name: "", category: "", target_market: "", problem_solved: "",
  price_positioning: "", target_age_range: "", target_gender: "", core_product_type: "",
};

async function generateBlueprintWithAI(form) {
  const prompt = `You are an expert brand strategist. Generate a complete brand blueprint based on this brand concept:

Brand Name: ${form.brand_name || "(Not defined — suggest 10 names)"}
Category: ${form.category}
Target Market: ${form.target_market}
Problem Solved: ${form.problem_solved}
Price Positioning: ${form.price_positioning}
Target Age Range: ${form.target_age_range || "Not specified"}
Target Gender: ${form.target_gender || "Not specified"}
Core Product Type: ${form.core_product_type || "Not specified"}

Generate a comprehensive brand blueprint. Be specific, creative, and actionable. Use real brand strategy frameworks.`;

  const schema = {
    type: "object",
    properties: {
      mission: { type: "string", description: "Brand mission statement (1-2 sentences, inspiring and clear)" },
      vision: { type: "string", description: "Brand vision (where the brand wants to be in 5-10 years)" },
      values: { type: "string", description: "3-5 core brand values with brief explanations (markdown list)" },
      brand_story: { type: "string", description: "Compelling brand origin/why story (2-3 paragraphs)" },
      brand_personality: { type: "string", description: "Brand personality traits with descriptions (markdown list)" },
      brand_voice: { type: "string", description: "Brand voice and tone guidelines with examples" },
      primary_audience: { type: "string", description: "Primary target audience with lifestyle, pain points, and buying motivations (detailed markdown)" },
      secondary_audience: { type: "string", description: "Secondary target audience profile (detailed markdown)" },
      customer_persona: { type: "string", description: "Detailed customer persona with name, age, job, lifestyle, pain points, buying motivations (markdown)" },
      usp: { type: "string", description: "Unique Selling Proposition (1-2 powerful sentences)" },
      competitive_positioning: { type: "string", description: "How this brand positions against competitors (markdown with specifics)" },
      differentiation: { type: "string", description: "Key brand differentiators and what makes it unique (markdown list)" },
      product_ideas: { type: "string", description: "5 product ideas with: product concept, target customer, estimated price range, key differentiation (detailed markdown)" },
      name_suggestions: { type: "string", description: "If brand name is empty, 10 brand name suggestions with brief explanation for each. If name exists, write 'Brand name is already defined.' (markdown)" },
      launch_plan: { type: "string", description: "90-day marketing launch plan including: social media strategy, influencer strategy, content ideas, launch campaign concept (detailed markdown)" },
    }
  };

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema,
  });

  return result;
}

export default function BrandDNA() {
  const [tab, setTab] = useState("form");
  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const qc = useQueryClient();

  const { data: dnaItems = [], isLoading } = useQuery({
    queryKey: ["brand_dna"],
    queryFn: () => base44.entities.BrandDNA.list("-created_date", 1),
    initialData: [],
  });

  const dna = dnaItems[0];

  useEffect(() => {
    if (dna) {
      setForm({
        brand_name: dna.brand_name || "",
        category: dna.category || "",
        target_market: dna.target_market || "",
        problem_solved: dna.problem_solved || "",
        price_positioning: dna.price_positioning || "",
        target_age_range: dna.target_age_range || "",
        target_gender: dna.target_gender || "",
        core_product_type: dna.core_product_type || "",
      });
      if (dna.status === "generated") setTab("blueprint");
    }
  }, [dna]);

  const saveMutation = useMutation({
    mutationFn: (data) => dna
      ? base44.entities.BrandDNA.update(dna.id, data)
      : base44.entities.BrandDNA.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand_dna"] }),
  });

  const handleGenerate = async () => {
    setGenerating(true);
    const blueprint = await generateBlueprintWithAI(form);
    await saveMutation.mutateAsync({
      ...form,
      ...blueprint,
      status: "generated",
      generated_at: new Date().toISOString().split("T")[0],
    });
    setTab("blueprint");
    setGenerating(false);
  };

  const handleEdit = () => setTab("form");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const BLUEPRINT_SECTIONS = [
    { key: "mission", title: "Brand Mission", icon: Heart, color: "violet", content: dna?.mission },
    { key: "vision", title: "Brand Vision", icon: Sparkles, color: "indigo", content: dna?.vision },
    { key: "values", title: "Core Values", icon: Target, color: "emerald", content: dna?.values },
    { key: "brand_story", title: "Brand Story", icon: Dna, color: "amber", content: dna?.brand_story },
    { key: "brand_personality", title: "Brand Personality", icon: Heart, color: "pink", content: dna?.brand_personality },
    { key: "brand_voice", title: "Brand Voice & Tone", icon: Target, color: "blue", content: dna?.brand_voice },
    { key: "primary_audience", title: "Primary Audience", icon: Users, color: "indigo", content: dna?.primary_audience },
    { key: "secondary_audience", title: "Secondary Audience", icon: Users, color: "violet", content: dna?.secondary_audience },
    { key: "customer_persona", title: "Customer Persona", icon: Users, color: "pink", content: dna?.customer_persona },
    { key: "usp", title: "Unique Selling Proposition", icon: Target, color: "emerald", content: dna?.usp },
    { key: "competitive_positioning", title: "Competitive Positioning", icon: Target, color: "amber", content: dna?.competitive_positioning },
    { key: "differentiation", title: "Brand Differentiation", icon: Sparkles, color: "blue", content: dna?.differentiation },
    { key: "product_ideas", title: "Product Ideas", icon: Lightbulb, color: "amber", content: dna?.product_ideas },
    { key: "name_suggestions", title: "Brand Name Suggestions", icon: Tag, color: "violet", content: dna?.name_suggestions },
    { key: "launch_plan", title: "Marketing Launch Plan", icon: Rocket, color: "orange", content: dna?.launch_plan },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Dna className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Brand DNA</h1>
              <p className="text-sm text-slate-400">AI-powered brand blueprint generator</p>
            </div>
          </div>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="form">
              <Dna className="h-3.5 w-3.5 mr-1.5" /> Brand Concept
            </TabsTrigger>
            <TabsTrigger value="blueprint" disabled={!dna?.status === "generated" && !dna}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Blueprint
              {dna?.status === "generated" && (
                <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="form" className="mt-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <BrandDNAForm
              form={form}
              onChange={setForm}
              onGenerate={handleGenerate}
              generating={generating}
            />
          </div>
        </TabsContent>

        <TabsContent value="blueprint" className="mt-6 space-y-5">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
              <p className="text-lg font-semibold text-slate-700">Generating your Brand Blueprint...</p>
              <p className="text-sm text-slate-400">AI is crafting your mission, audience, product ideas, and launch plan</p>
            </div>
          ) : dna?.status === "generated" ? (
            <>
              <BlueprintHeader
                dna={dna}
                onEdit={handleEdit}
                onRegenerate={handleGenerate}
                generating={generating}
              />

              {/* Brand Identity */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Brand Identity</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {BLUEPRINT_SECTIONS.slice(0, 6).map(s => (
                    <BlueprintSection key={s.key} icon={s.icon} title={s.title} content={s.content} color={s.color} />
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Target Audience</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {BLUEPRINT_SECTIONS.slice(6, 9).map(s => (
                    <BlueprintSection key={s.key} icon={s.icon} title={s.title} content={s.content} color={s.color} />
                  ))}
                </div>
              </div>

              {/* Positioning */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Market Positioning</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {BLUEPRINT_SECTIONS.slice(9, 12).map(s => (
                    <BlueprintSection key={s.key} icon={s.icon} title={s.title} content={s.content} color={s.color} />
                  ))}
                </div>
              </div>

              {/* Products & Launch */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Products & Launch</p>
                <div className="grid md:grid-cols-1 gap-4">
                  {BLUEPRINT_SECTIONS.slice(12).map(s => (
                    <BlueprintSection key={s.key} icon={s.icon} title={s.title} content={s.content} color={s.color} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Dna className="h-8 w-8 text-violet-400" />
              </div>
              <p className="text-lg font-semibold text-slate-600">No blueprint generated yet</p>
              <p className="text-sm text-slate-400">Fill in your brand concept and generate your AI brand blueprint</p>
              <button onClick={() => setTab("form")} className="text-sm text-violet-600 underline underline-offset-2">Go to Brand Concept form →</button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}