'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;


interface Department {
    id: number;
    departmentName: string;
}

interface Designation {
    id: number;
    designationName: string;
}

interface EmployeeLite {
    employeeId: string;
    name: string;
}


/* ---------------- SMALL UI HELPER ---------------- */
const Field = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">{label}</label>
        {children}
    </div>
);

export default function AddEmployeePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);


    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [employees, setEmployees] = useState<EmployeeLite[]>([]);


    const [form, setForm] = useState({
        employeeId: '',
        name: '',
        email: '',
        password: '',
        gender: 'Male',
        birthday: '',
        bloodGroup: '',
        joiningDate: '',
        language: '',
        designationId: '',
        departmentId: '',
        reportingToId: '',
        role: 'ROLE_EMPLOYEE',
        country: 'usa',
        mobile: '',
        address: '',
        about: '',
        loginAllowed: true,
        receiveEmailNotification: false,
        hourlyRate: '',
        slackMemberId: '',
        skills: '',
        probationEndDate: '',
        noticePeriodStartDate: '',
        noticePeriodEndDate: '',
        employmentType: 'Full Time',
        maritalStatus: 'Single',
        businessAddress: '',
        officeShift: '',
    });


    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        // if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        // Departments
        fetch(`${BASE_URL}/admin/departments`, { headers })
            .then(res => res.json())
            .then(setDepartments)
            .catch(console.error);

        // Designations
        fetch(`${BASE_URL}/admin/designations`, { headers })
            .then(res => res.json())
            .then(setDesignations)
            .catch(console.error);

        // Employees (Reporting To)
        fetch(`${BASE_URL}/employee/all`, { headers })
            .then(res => res.json())
            .then(data =>
                setEmployees(
                    data.map((e: any) => ({
                        employeeId: e.employeeId,
                        name: e.name,
                    }))
                )
            )
            .catch(console.error);
    }, []);


    /* ---------------- CHANGE HANDLER ---------------- */
    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({
            ...p,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            if (!token) throw new Error('No access token');

            const employeePayload = {
                ...form,
                departmentId: Number(form.departmentId),
                designationId: Number(form.designationId),
                hourlyRate: Number(form.hourlyRate),
                skills: form.skills
                    ? form.skills.split(',').map((s) => s.trim())
                    : [],
            };

            const fd = new FormData();
            fd.append('employee', JSON.stringify(employeePayload));
            if (file) fd.append('file', file);
            //("deveshjhdsh", fd)

            const res = await fetch(`${BASE_URL}/employee`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: fd,
            });

            if (!res.ok) throw new Error('Failed to create employee');

            await res.json();
            router.push('/hr/employee');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">

            {/* ================= ACCOUNT DETAILS ================= */}
            <div className="bg-white border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6">Account Details</h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Row 1 */}
                    <div className="grid grid-cols-3 gap-6">
                        <Field label="Employee ID *">
                            <input name="employeeId" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required />
                        </Field>

                        <Field label="Employee Name *">
                            <input name="name" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required />
                        </Field>

                        <div className="row-span-2">
                            <label className="text-sm font-medium text-gray-600">
                                Profile Picture
                            </label>
                            <label className="mt-2 flex flex-col items-center justify-center h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                <span className="text-sm text-gray-400">Choose a file</span>
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>

                        <Field label="Employee Email *">
                            <input name="email" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required />
                            <span className="text-xs text-gray-400">
                                Must have at least 8 characters
                            </span>
                        </Field>

                        <Field label="Password *">
                            <input
                                type="password"
                                name="password"
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"

                                required
                            />
                        </Field>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-5 gap-4">
                        <Field label="Gender *">
                            <select name="gender" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </Field>

                        <Field label="Date of Birth *">
                            <input type="date" name="birthday" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Field>

                        {/* <Field label="Blood Group *">
                            <input name="bloodGroup" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Field> */}

<Field label="Blood Group *">
  <select
    name="bloodGroup"
    onChange={handleChange}
    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select Blood Group</option>
    <option value="A+">A+</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B-">B-</option>
    <option value="AB+">AB+</option>
    <option value="AB-">AB-</option>
    <option value="O+">O+</option>
    <option value="O-">O-</option>
  </select>
</Field>



                        <Field label="Joining Date *">
                            <input type="date" name="joiningDate" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Field>

                        {/* <Field label="Language *">
                            <input name="language" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Field> */}


<Field label="Language *">
  <select
    name="language"
    onChange={handleChange}
    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select Language</option>
    <option value="English">English</option>
    <option value="Hindi">Polski</option>
    <option value="French">Lithuanian</option>
    <option value="Dutch">Dutch</option>
    <option value="Danish">German</option>
    <option value="Russian">Russian</option>
  </select>
</Field>



                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-3 gap-4">
                        <Field label="Designation *">
                            <select
                                name="designationId"
                                value={form.designationId}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                                required
                            >
                                <option value="">Select Designation</option>
                                {designations.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.designationName}
                                    </option>
                                ))}
                            </select>
                        </Field>


                        <Field label="Department *">
                            <select
                                name="departmentId"
                                value={form.departmentId}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.departmentName}
                                    </option>
                                ))}
                            </select>
                        </Field>


                        <Field label="Reporting To *">
                            <select
                                name="reportingToId"
                                value={form.reportingToId}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                                required
                            >
                                <option value="">Select Manager</option>
                                {employees.map((e) => (
                                    <option key={e.employeeId} value={e.employeeId}>
                                        {e.name} ({e.employeeId})
                                    </option>
                                ))}
                            </select>
                        </Field>

                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-3 gap-4">
                        <Field label="User Role *">
                            <select name="role" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ROLE_EMPLOYEE">Employee</option>
                                <option value="ROLE_ADMIN">Admin</option>
                            </select>
                        </Field>

                        {/* <Field label="Country">
                            <input name="country" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Field> */}

<Field label="Country">
  <select
    name="country"
    onChange={handleChange}
    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select Country</option>
    <option value="USA">USA</option>
    <option value="UK">UK</option>
    <option value="Canada">Canada</option>
    <option value="Australia">Australia</option>
     <option value="Japan">Japan</option>
    <option value="South Korea">South Korea</option>
    <option value="China">China</option>

    <option value="South Africa">South Africa</option>
    <option value="Nigeria">Nigeria</option>
    <option value="Kenya">Kenya</option>

    <option value="Brazil">Brazil</option>
    <option value="Argentina">Argentina</option>
    <option value="Mexico">Mexico</option>

    <option value="Other">Other</option>
  </select>
</Field>



                        <Field label="Mobile">
                            <input name="mobile" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Field>
                    </div>

                    <Field label="Address *">
                        <input name="address" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field>

                    <Field label="About">
                        <textarea name="about" onChange={handleChange} className="border rounded-lg input h-24" />
                    </Field>
                </form>
            </div>

            {/* ================= OTHER DETAILS ================= */}
            <div className="bg-white border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6">Other Details</h2>

                <div className="grid grid-cols-4 gap-6">
                    <Field label="Login Allowed?">
                        <div className="flex gap-4">
                            <label className="flex gap-2">
                                <input
                                    type="radio"
                                    checked={form.loginAllowed}
                                    onChange={() =>
                                        setForm((p) => ({ ...p, loginAllowed: true }))
                                    }
                                />
                                Yes
                            </label>
                            <label className="flex gap-2">
                                <input
                                    type="radio"
                                    checked={!form.loginAllowed}
                                    onChange={() =>
                                        setForm((p) => ({ ...p, loginAllowed: false }))
                                    }
                                />
                                No
                            </label>
                        </div>
                    </Field>

                    <Field label="Receive Email Notifications?">
                        <div className="flex gap-4">
                            <label className="flex gap-2">
                                <input
                                    type="radio"
                                    checked={form.receiveEmailNotification}
                                    onChange={() =>
                                        setForm((p) => ({ ...p, receiveEmailNotification: true }))
                                    }
                                />
                                Yes
                            </label>
                            <label className="flex gap-2">
                                <input
                                    type="radio"
                                    checked={!form.receiveEmailNotification}
                                    onChange={() =>
                                        setForm((p) => ({ ...p, receiveEmailNotification: false }))
                                    }
                                />
                                No
                            </label>
                        </div>
                    </Field>

                    <Field label="Hourly Rate">
                        <input name="hourlyRate" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field>

                    <Field label="Slack Member ID">
                        <input name="slackMemberId" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field>
                </div>

                <Field label="Skills" >
                    <input
                        name="skills"
                        onChange={handleChange}
                        placeholder="Java, Spring Boot"
                        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"

                    />
                </Field>

                <div className="grid grid-cols-4 gap-4 mt-6">
                    <Field label="Probation End Date">
                        <input type="date" name="probationEndDate" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field>

                    <Field label="Notice Period Start Date">
                        <input type="date" name="noticePeriodStartDate" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field>

                    <Field label="Notice Period End Date">
                        <input type="date" name="noticePeriodEndDate" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field>

                    <Field label="Employment Type">
                        <select name="employmentType" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>Full Time</option>
                            <option>Part Time</option>
                            <option>Contract</option>
                        </select>
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <Field label="Marital Status">
                        <select name="maritalStatus" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>Single</option>
                            <option>Married</option>
                        </select>
                    </Field>

                    {/* <Field label="Business Address *">
                        <input name="businessAddress" onChange={handleChange} className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </Field> */}

<Field label="Business Address *">
  <select
    name="businessAddress"
    onChange={handleChange}
    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select Office Location</option>
    <option value="Head Office">Head Office</option>
    <option value="Branch Office">Branch Office</option>
    <option value="Remote">Remote</option>
    <option value="Client Location">Client Location</option>
  </select>
</Field>



                </div>
            </div>

            {/* ================= FOOTER ================= */}
            <div className="flex justify-end gap-4">
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2 border rounded-lg"
                >
                    Cancel
                </button>
                <button
                    disabled={loading}
                    onClick={handleSubmit}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg"
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
}
