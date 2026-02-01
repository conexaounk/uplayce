import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useDJ } from "@/hooks/use-djs";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Save, ArrowLeft, Music2, MapPin, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getStorageUrl } from "@/lib/storageUtils";
import { EmojiAvatarPicker } from "@/components/EmojiAvatarPicker";
import { AvatarUpload } from "@/components/AvatarUpload";

interface ProfileFormData {
  dj_name: string;
  bio: string;
  city: string;
  avatar_emoji?: string;
  avatar_url?: string | null;
}

export default function ProfileEditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = useDJ(user?.id || "");
  const updateProfile = useUpdateProfile();
  const [, setLocation] = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      dj_name: "",
      bio: "",
      city: "",
      avatar_emoji: "",
      avatar_url: null,
    },
  });

  useEffect(() => {
    if (myProfile) {
      form.reset({
        dj_name: myProfile.dj_name || "",
        bio: myProfile.bio || "",
        city: myProfile.city || "",
        avatar_emoji: (myProfile as any).avatar_emoji || "",
        avatar_url: myProfile.avatar_url || null,
      });
      setAvatarUrl(myProfile.avatar_url || null);
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
    updateProfile.mutate(
      { id: user.id, ...data, avatar_url: avatarUrl },
      {
        onSuccess: () => {
          setLocation("/profile");
        },
      }
    );
  };

  const handleAvatarUploadComplete = (url: string) => {
    setAvatarUrl(url);
    form.setValue("avatar_url", url);
  };

  const avatarEmoji = form.watch("avatar_emoji");

  return (
    <div className="min-h-screen pt-20 pb-20">
      {/* Header Section */}
      <div className="border-b border-white/5 bg-gradient-to-b from-background to-background/50 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/profile")}
            className="hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar ao Perfil
          </Button>

          <div className="flex items-center gap-4">
            {avatarEmoji && (
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-2xl">{avatarEmoji}</span>
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Editar Perfil
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold">Informações do Perfil</h2>
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="dj_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Nome Artístico *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ex: DJ Cyberpunk"
                              {...field}
                              className="bg-background/50 border-white/10 h-12 text-lg"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Este é o nome que aparecerá nas suas músicas
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Localização</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="São Paulo, SP"
                              {...field}
                              className="bg-background/50 border-white/10 h-12"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Ajude os fãs a encontrarem artistas da sua região
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Sobre Você</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Conte sua história, estilo musical, influências..."
                              className="min-h-[180px] bg-background/50 border-white/10 resize-none text-base leading-relaxed"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Apresente seu som e conecte-se com sua audiência
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setLocation("/profile")}
                    disabled={updateProfile.isPending}
                    className="min-w-[140px] h-12"
                  >
                    <X className="mr-2" size={18} />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-primary hover:bg-primary/90 font-semibold min-w-[180px] h-12"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                      <Save className="mr-2" size={20} />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Avatar Upload */}
                <Card className="bg-card/50 border-white/10 backdrop-blur-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Music2 className="text-primary" size={20} />
                    <h3 className="font-bold text-lg">Foto do Perfil</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Faça upload de uma imagem para seu avatar
                  </p>
                  {user && (
                    <AvatarUpload
                      currentAvatarUrl={avatarUrl}
                      onUploadComplete={handleAvatarUploadComplete}
                      userId={user.id}
                    />
                  )}
                </Card>

              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
