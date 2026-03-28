
import { GoogleGenAI, Type } from "@google/genai";
import { PlateRecord } from "../types";

export const validatePlateRecord = async (data: Partial<PlateRecord>) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `بصفتك خبيراً في أرشفة لوحات إدارة مرور تعز، حلل البيانات التالية للتأكد من منطقيتها:
      - رقم اللوحة: ${data.plateNumber}
      - الفاصل: ${data.category}
      - رقم المحضر: ${data.reportNumber}
      - النوع: ${data.plateType}
      قدم رأيك باختصار شديد حول صحة تطابق البيانات مع معايير المرور في تعز باللغة العربية.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLikelyValid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isLikelyValid", "reason"]
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return { isLikelyValid: true, reason: "تم قبول البيانات مبدئياً." };
  }
};

export const generateArchiveSummary = async (records: PlateRecord[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `قم بتوليد تقرير إداري مفصل لأرشيف اللوحات في إدارة مرور محافظة تعز بناءً على هذه البيانات: ${JSON.stringify(records)}. ركز على توزيع الفواصل والأنواع وإحصائيات التوريد للمخازن.`,
    });
    return response.text || "تعذر إنشاء التقرير.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "خطأ في الاتصال بالذكاء الاصطناعي.";
  }
};
