'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const marriageSchema = z.object({
  marriageDate: z.date({
    required_error: 'Marriage date is required',
  }),
  groomName: z.string().min(2, 'Groom name must be at least 2 characters'),
  brideName: z.string().min(2, 'Bride name must be at least 2 characters'),
  placeOfMarriage: z.string().min(2, 'Place of marriage is required'),
  certificateNumber: z.string().min(1, 'Certificate number is required'),
  licenseType: z.string().optional(),
});

type MarriageFormData = z.infer<typeof marriageSchema>;

interface MarriageFormProps {
  marriage?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MarriageForm({ marriage, onSuccess, onCancel }: MarriageFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<MarriageFormData>({
    resolver: zodResolver(marriageSchema),
    defaultValues: {
      marriageDate: marriage ? new Date(marriage.marriage_date) : undefined,
      groomName: marriage?.groom_name || '',
      brideName: marriage?.bride_name || '',
      placeOfMarriage: marriage?.place_of_marriage || '',
      certificateNumber: marriage?.certificate_number || '',
      licenseType: marriage?.license_type || '',
    },
  });

  const onSubmit = async (data: MarriageFormData) => {
    setIsLoading(true);

    try {
      const marriageData = {
        marriage_date: format(data.marriageDate, 'yyyy-MM-dd'),
        groom_name: data.groomName,
        bride_name: data.brideName,
        place_of_marriage: data.placeOfMarriage,
        certificate_number: data.certificateNumber,
        license_type: data.licenseType || null,
      };

      if (marriage) {
        // Update existing marriage
        const { error } = await supabase
          .from('marriages')
          .update(marriageData)
          .eq('id', marriage.id);

        if (error) throw error;

        toast({
          title: 'Marriage updated',
          description: 'Marriage record has been successfully updated.',
        });
      } else {
        // Create new marriage
        const { error } = await supabase
          .from('marriages')
          .insert(marriageData);

        if (error) throw error;

        toast({
          title: 'Marriage registered',
          description: 'New marriage record has been successfully created.',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while saving the marriage record.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-lg bg-white/80 border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span>{marriage ? 'Edit Marriage' : 'Register Marriage'}</span>
          </CardTitle>
          <CardDescription>
            {marriage ? 'Update marriage registration details' : 'Enter the details for the new marriage registration'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="groomName">Groom's Full Name</Label>
                <Input
                  id="groomName"
                  placeholder="Enter groom's full name"
                  {...form.register('groomName')}
                />
                {form.formState.errors.groomName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.groomName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brideName">Bride's Full Name</Label>
                <Input
                  id="brideName"
                  placeholder="Enter bride's full name"
                  {...form.register('brideName')}
                />
                {form.formState.errors.brideName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.brideName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Marriage Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('marriageDate') && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {form.watch('marriageDate') ? (
                      format(form.watch('marriageDate'), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={form.watch('marriageDate')}
                    onSelect={(date) => form.setValue('marriageDate', date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.marriageDate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.marriageDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeOfMarriage">Place of Marriage</Label>
              <Input
                id="placeOfMarriage"
                placeholder="Enter place of marriage"
                {...form.register('placeOfMarriage')}
              />
              {form.formState.errors.placeOfMarriage && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.placeOfMarriage.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certificateNumber">Certificate Number</Label>
                <Input
                  id="certificateNumber"
                  placeholder="Enter certificate number"
                  {...form.register('certificateNumber')}
                />
                {form.formState.errors.certificateNumber && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.certificateNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type (Optional)</Label>
                <Input
                  id="licenseType"
                  placeholder="e.g., Registrar's Certificate, Special License"
                  {...form.register('licenseType')}
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  marriage ? 'Update Marriage' : 'Register Marriage'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}