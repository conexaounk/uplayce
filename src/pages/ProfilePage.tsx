import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useDJ } from "@/hooks/use-djs";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getStorageUrl } from "@/lib/storageUtils";
import { EmojiAvatarPicker } from "@/components/EmojiAvatarPicker";

interface ProfileFormData {
  dj_name: string;
  bio: string;
  city: string;
  avatar_emoji?: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = useDJ(user?.id || "");
  const updateProfile = useUpdateProfile();
  const [, setLocation] = useLocation();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      dj_name: "",
      bio: "",
      city: "",
      avatar_emoji: "",
    },
  });

  // Load existing data when available
  useEffect(() => {
    if (myProfile) {
      form.reset({
        dj_name: myProfile.dj_name || "",
        bio: myProfile.bio || "",
        city: myProfile.city || "",
        avatar_emoji: (myProfile as any).avatar_emoji || "",
      });
    }
  }, [myProfile, form]);

  if (authLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate({ id: user.id, ...data });
  };

  const avatarUrl = getStorageUrl(myProfile?.avatar_url, "avatars") || "/placeholder.svg";
  const avatarEmoji = (myProfile as any)?.avatar_emoji;

  return (
    <div className="min-h-screen pt-24 pb-20 container max-w-4xl mx-auto px-4">
      <Card className="bg-card border-white/10 shadow-2xl">
        <CardHeader className="border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {avatarEmoji ? (
                <span className="text-6xl">{avatarEmoji}</span>
              ) : (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <CardTitle className="text-3xl font-bold mb-2">Perfil do Artista</CardTitle>
              <p className="text-muted-foreground">Gerencie sua presença pública no marketplace.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dj_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Artístico</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: DJ Cyberpunk" {...field} className="bg-background/50 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo, SP" {...field} className="bg-background/50 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte-nos sobre seu som..."
                        className="min-h-[120px] bg-background/50 border-white/10 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary hover:bg-primary/80 font-bold min-w-[150px]"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
                  Salvar Perfil
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
