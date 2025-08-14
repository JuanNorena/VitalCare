import { useState } from "react";
import { useParams } from "wouter";
import { usePublicSurvey } from "@/hooks/use-surveys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PublicSurvey() {
  const { token } = useParams<{ token: string }>();
  const { survey, isLoading, error, submitResponse, isSubmitting } = usePublicSurvey(token || "");
  const { t } = useTranslation();
  const [responses, setResponses] = useState<Record<number, { response?: string; numericValue?: number }>>({});
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">{t('surveys.surveyNotFound')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>{t('surveys.surveyNotFoundDescription', 'La encuesta no se encontró o ha expirado.')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">{t('surveys.thankYou')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>{t('surveys.thankYouDescription')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (survey?.survey?.isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>{t('surveys.surveyAlreadyCompleted')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>{t('surveys.surveyAlreadyCompletedDescription', 'Esta encuesta ya ha sido completada anteriormente.')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar si hay preguntas configuradas
  if (!survey?.questions || survey.questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>{t('surveys.noQuestionsAvailable', 'No hay preguntas configuradas')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>{t('surveys.noQuestionsConfigured', 'Esta encuesta no tiene preguntas configuradas. Por favor contacte al administrador.')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResponseChange = (questionId: number, value: string | number, type: 'response' | 'numericValue') => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required questions
    const requiredQuestions = survey?.questions?.filter((q: any) => q.required) || [];
    const missingResponses = requiredQuestions.filter((q: any) => {
      const response = responses[q.id];
      if (q.type === "rating") {
        return !response?.numericValue || response.numericValue < 1 || response.numericValue > 5;
      }
      return !response?.response || response.response.trim() === "";
    });

    if (missingResponses.length > 0) {
      alert(t('surveys.requiredFieldsMissing', 'Por favor complete todas las preguntas obligatorias.'));
      return;
    }

    // Transform responses for API
    const formattedResponses = Object.entries(responses).map(([questionId, response]) => ({
      questionId: parseInt(questionId),
      response: response.response,
      numericValue: response.numericValue
    }));

    submitResponse(formattedResponses);
    setSubmitted(true);
  };

  const renderQuestionInput = (question: any) => {
    const response = responses[question.id] || {};

    switch (question.type) {
      case "rating":
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('surveys.ratingLabel')}</Label>
            <RadioGroup
              value={response.numericValue?.toString() || ""}
              onValueChange={(value) => handleResponseChange(question.id, parseInt(value), 'numericValue')}
              className="flex space-x-4"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`q${question.id}-r${rating}`} />
                  <Label htmlFor={`q${question.id}-r${rating}`} className="flex items-center space-x-1 cursor-pointer">
                    <span>{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "text":
        return (
          <div className="space-y-2">
            <Label htmlFor={`q${question.id}`} className="text-sm font-medium">
              {t('surveys.textLabel')}
            </Label>
            <Textarea
              id={`q${question.id}`}
              value={response.response || ""}
              onChange={(e) => handleResponseChange(question.id, e.target.value, 'response')}
              placeholder={t('surveys.textPlaceholder', 'Escriba su respuesta aquí...')}
              rows={3}
            />
          </div>
        );

      case "multiple_choice":
        return (
          <div className="space-y-2">
            <Label htmlFor={`q${question.id}`} className="text-sm font-medium">
              {t('surveys.selectOption')}
            </Label>
            <Select
              value={response.response || ""}
              onValueChange={(value) => handleResponseChange(question.id, value, 'response')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('surveys.selectOption')} />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t('surveys.surveyTitle')}</CardTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>{t('surveys.surveyFor')}:</strong> {survey?.survey?.patientName}</p>
              <p><strong>{t('surveys.service')}:</strong> {survey?.service?.name}</p>
              <p><strong>{t('surveys.branch')}:</strong> {survey?.branch?.name}</p>
            </div>
          </CardHeader>
          
          <CardContent>
            <p className="text-muted-foreground mb-6 text-center">
              {t('surveys.surveyDescription')}
            </p>
            
            <p className="text-sm text-muted-foreground mb-6 text-center">
              {t('surveys.surveyInstructions')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {survey?.questions?.map((question: any, index: number) => (
                <Card key={question.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Badge variant="outline" className="mt-1">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <h3 className="font-medium mb-3 flex items-center space-x-2">
                            <span>{question.question}</span>
                            {question.required && (
                              <span className="text-destructive">*</span>
                            )}
                          </h3>
                          {renderQuestionInput(question)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-center pt-6">
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('surveys.submittingSurvey')}</span>
                    </div>
                  ) : (
                    t('surveys.submitSurvey')
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
