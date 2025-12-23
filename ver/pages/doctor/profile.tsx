import DoctorLayout from './DoctorLayout';
import ProfileSection from '../dashboard/ProfileSection'; // Reuse the same component!

export default function DoctorProfilePage() {
  return (
    <DoctorLayout>
      <ProfileSection />
    </DoctorLayout>
  );
}