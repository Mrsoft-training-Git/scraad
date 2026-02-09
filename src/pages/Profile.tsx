import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserIcon, Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  department: string;
  bio: string;
  avatar_url: string;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "", email: "", phone: "", department: "", bio: "", avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
      setUserRole(roleData?.role || "student");

      const { data: profileData } = await supabase.from("profiles").select("full_name, email, phone, department, bio, avatar_url").eq("id", session.user.id).maybeSingle();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || session.user.email || "",
          phone: profileData.phone || "",
          department: profileData.department || "",
          bio: profileData.bio || "",
          avatar_url: profileData.avatar_url || "",
        });
      } else {
        setProfile(prev => ({ ...prev, email: session.user.email || "" }));
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, email: profile.email, phone: profile.phone, department: profile.department, bio: profile.bio,
    }).eq("id", user.id);

    if (error) { toast({ title: "Error", description: "Failed to update profile", variant: "destructive" }); }
    else { toast({ title: "Success", description: "Profile updated successfully" }); }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) { toast({ title: "Error", description: "New passwords do not match", variant: "destructive" }); return; }
    if (passwords.new.length < 6) { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Success", description: "Password updated successfully" }); setPasswords({ current: "", new: "", confirm: "" }); }
    setChangingPassword(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("course-images").upload(filePath, file, { upsert: true });
    if (uploadError) { toast({ title: "Error", description: "Failed to upload avatar", variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("course-images").getPublicUrl(filePath);
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    if (updateError) { toast({ title: "Error", description: "Failed to update profile", variant: "destructive" }); }
    else { setProfile(prev => ({ ...prev, avatar_url: publicUrl })); toast({ title: "Success", description: "Avatar updated successfully" }); }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} userRole={userRole}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account information</p>
        </div>

        {/* Avatar */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-center gap-5">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {profile.full_name ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : <UserIcon className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <Input type="file" accept="image/*" onChange={handleAvatarUpload} className="h-9 text-xs" />
                <p className="text-[11px] text-muted-foreground">Square image, at least 400×400px</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                <Input placeholder="John Doe" value={profile.full_name} onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input type="email" placeholder="john@example.com" value={profile.email} onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                <Input type="tel" placeholder="+234 xxx xxx xxxx" value={profile.phone} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Department</Label>
                <Input placeholder="Computer Science" value={profile.department} onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Bio</Label>
              <Textarea placeholder="Tell us about yourself..." rows={3} value={profile.bio} onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))} />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="h-8 text-xs">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Current Password</Label>
              <Input type="password" value={passwords.current} onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))} className="h-9 max-w-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">New Password</Label>
                <Input type="password" value={passwords.new} onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Confirm New Password</Label>
                <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))} className="h-9" />
              </div>
            </div>
            <Button onClick={handlePasswordChange} disabled={changingPassword} size="sm" className="h-8 text-xs">
              {changingPassword && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
