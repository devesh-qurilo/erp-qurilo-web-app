'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

/* ================= TYPES ================= */
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

/* ================= UI HELPER ================= */
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

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);

    const [form, setForm] = useState<any>({
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
        country: '',
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
        employmentType: '',
        maritalStatus: '',
        businessAddress: '',
        officeShift: '',
    });

    const getToken = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('No access token found');
        return token;
    };

    const fetchJson = async <T,>(url: string): Promise<T> => {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (!res.ok) {
            throw new Error((await res.text()) || 'Request failed');
        }

        return res.json() as Promise<T>;
    };

    const { data: departments = [] } = useQuery({
        queryKey: ['employee-edit', 'departments'],
        queryFn: () => fetchJson<Department[]>(`${BASE_URL}/admin/departments`),
        enabled: Boolean(employeeId),
    });

    const { data: designations = [] } = useQuery({
        queryKey: ['employee-edit', 'designations'],
        queryFn: () => fetchJson<Designation[]>(`${BASE_URL}/admin/designations`),
        enabled: Boolean(employeeId),
    });

    const { data: employees = [] } = useQuery<EmployeeLite[]>({
        queryKey: ['employee-edit', 'employees'],
        queryFn: async () => {
            const data = await fetchJson<EmployeeLite[]>(`${BASE_URL}/employee/all`);
            return data.map((e) => ({
                employeeId: e.employeeId,
                name: e.name,
            }));
        },
        enabled: Boolean(employeeId),
    });

    const employeeQuery = useQuery<Record<string, any>>({
        queryKey: ['employee-edit', employeeId],
        queryFn: () => fetchJson<any>(`${BASE_URL}/employee/${employeeId}`),
        enabled: Boolean(employeeId),
    });

    useEffect(() => {
        if (!employeeQuery.data) {
            return;
        }

        const emp = employeeQuery.data;
        setForm({
            employeeId: emp.employeeId,
            name: emp.name ?? '',
            email: emp.email ?? '',
            password: '',
            gender: emp.gender ?? 'Male',
            birthday: emp.birthday ?? '',
            bloodGroup: emp.bloodGroup ?? '',
            joiningDate: emp.joiningDate ?? '',
            language: emp.language ?? '',
            designationId: emp.designationId?.toString() ?? '',
            departmentId: emp.departmentId?.toString() ?? '',
            reportingToId: emp.reportingToId ?? '',
            role: emp.role ?? 'ROLE_EMPLOYEE',
            country: emp.country ?? '',
            mobile: emp.mobile ?? '',
            address: emp.address ?? '',
            about: emp.about ?? '',
            loginAllowed: emp.loginAllowed ?? true,
            receiveEmailNotification: emp.receiveEmailNotification ?? false,
            hourlyRate: emp.hourlyRate?.toString() ?? '',
            slackMemberId: emp.slackMemberId ?? '',
            skills: emp.skills?.join(', ') ?? '',
            probationEndDate: emp.probationEndDate ?? '',
            noticePeriodStartDate: emp.noticePeriodStartDate ?? '',
            noticePeriodEndDate: emp.noticePeriodEndDate ?? '',
            employmentType: emp.employmentType ?? '',
            maritalStatus: emp.maritalStatus ?? '',
            businessAddress: emp.businessAddress ?? '',
            officeShift: emp.officeShift ?? '',
        });
        setInitialLoading(false);
    }, [employeeQuery.data]);

    useEffect(() => {
        if (employeeQuery.isError) {
            console.error(employeeQuery.error);
            setInitialLoading(false);
            alert('Failed to load employee data');
        }
    }, [employeeQuery.error, employeeQuery.isError]);

    const updateEmployeeMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                ...form,
                departmentId: Number(form.departmentId),
                designationId: Number(form.designationId),
                hourlyRate: Number(form.hourlyRate),
                skills: form.skills
                    ? form.skills.split(',').map((s: string) => s.trim())
                    : [],
            };

            const fd = new FormData();
            fd.append('employee', JSON.stringify(payload));
            if (file) fd.append('file', file);

            const res = await fetch(`${BASE_URL}/employee/${employeeId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: fd,
            });

            if (!res.ok) throw new Error((await res.text()) || 'Failed to update employee');

            return res.json();
        },
    });



    /* ================= CHANGE HANDLER ================= */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((p: Record<string, unknown>) => ({
            ...p,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    /* ================= UPDATE ================= */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateEmployeeMutation.mutateAsync();
            router.push('/hr/employee');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-6">Loading employee details... </div>;
    }

    /* ================= UI ================= */
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">

            <h1 className="text-xl font-semibold">Edit Employee</h1>

            {/* ================= ACCOUNT DETAILS ================= */}
            <div className="bg-white border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6">Account Details</h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Row 1 */}
                    <div className="grid grid-cols-3 gap-6">
                        <Field label="Employee ID *">
                            <input
                                name="employeeId"
                                value={form.employeeId}
                                disabled
                                className="border rounded-lg px-3 py-2 bg-gray-100"
                            />
                        </Field>

                        <Field label="Employee Name *">
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                                required
                            />
                        </Field>

                        <div className="row-span-2">
                            <label className="text-sm font-medium text-gray-600">Profile Picture</label>
                            <label className="mt-2 flex flex-col items-center justify-center h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                                <span className="text-sm text-gray-400">Change picture</span>
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>

                        <Field label="Employee Email *">
                            <input
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                                required
                            />
                        </Field>

                        <Field label="Password">
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            />
                        </Field>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-5 gap-4">
                        <Field label="Gender *">
                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            >
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </Field>

                        <Field label="Date of Birth *">
                            <input
                                type="date"
                                name="birthday"
                                value={form.birthday || ''}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            />
                        </Field>

                        <Field label="Blood Group *">
                            <input
                                name="bloodGroup"
                                value={form.bloodGroup}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            />
                        </Field>

                        <Field label="Joining Date *">
                            <input
                                type="date"
                                name="joiningDate"
                                value={form.joiningDate || ''}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            />
                        </Field>

                        <Field label="Language *">
                            <input
                                name="language"
                                value={form.language}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            />
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
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            >
                                <option value="ROLE_EMPLOYEE">Employee</option>
                                <option value="ROLE_ADMIN">Admin</option>
                            </select>
                        </Field>

                        <Field label="Country">
                            <input
                                name="country"
                                value={form.country}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            />
                        </Field>

                        <Field label="Mobile">
                            <input
                                name="mobile"
                                value={form.mobile}
                                onChange={handleChange}
                                className="border rounded-lg px-3 py-2"
                            />
                        </Field>
                    </div>

                    <Field label="Address *">
                        <input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        />
                    </Field>

                    <Field label="About">
                        <textarea
                            name="about"
                            value={form.about}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2 h-24"
                        />
                    </Field>
                </form>
            </div>

            {/* ================= OTHER DETAILS ================= */}
            <div className="bg-white border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6">Other Details</h2>

                <div className="grid grid-cols-4 gap-6">
                    <Field label="Login Allowed?">
                        <div className="flex gap-4">
                            <label>
                                <input
                                    type="radio"
                                    checked={form.loginAllowed}
                                    onChange={() => setForm(p => ({ ...p, loginAllowed: true }))}
                                /> Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    checked={!form.loginAllowed}
                                    onChange={() => setForm(p => ({ ...p, loginAllowed: false }))}
                                /> No
                            </label>
                        </div>
                    </Field>

                    <Field label="Receive Email Notifications?">
                        <div className="flex gap-4">
                            <label>
                                <input
                                    type="radio"
                                    checked={form.receiveEmailNotification}
                                    onChange={() => setForm(p => ({ ...p, receiveEmailNotification: true }))}
                                /> Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    checked={!form.receiveEmailNotification}
                                    onChange={() => setForm(p => ({ ...p, receiveEmailNotification: false }))}
                                /> No
                            </label>
                        </div>
                    </Field>

                    <Field label="Hourly Rate">
                        <input
                            name="hourlyRate"
                            value={form.hourlyRate}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        />
                    </Field>

                    <Field label="Slack Member ID">
                        <input
                            name="slackMemberId"
                            value={form.slackMemberId}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        />
                    </Field>
                </div>

                <Field label="Skills">
                    <input
                        name="skills"
                        value={form.skills}
                        onChange={handleChange}
                        className="border rounded-lg px-3 py-2"
                    />
                </Field>

                <div className="grid grid-cols-4 gap-4 mt-6">
                    <Field label="Probation End Date">
                        <input
                            type="date"
                            name="probationEndDate"
                            value={form.probationEndDate || ''}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        />
                    </Field>

                    <Field label="Notice Period Start Date">
                        <input
                            type="date"
                            name="noticePeriodStartDate"
                            value={form.noticePeriodStartDate || ''}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        />
                    </Field>

                    <Field label="Notice Period End Date">
                        <input
                            type="date"
                            name="noticePeriodEndDate"
                            value={form.noticePeriodEndDate || ''}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        />
                    </Field>

                    <Field label="Employment Type">
                        <select
                            name="employmentType"
                            value={form.employmentType}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option>Full Time</option>
                            <option>Part Time</option>
                            <option>Contract</option>
                        </select>
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <Field label="Marital Status">
                        <select
                            name="maritalStatus"
                            value={form.maritalStatus}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option>Single</option>
                            <option>Married</option>
                        </select>
                    </Field>

                    <Field label="Business Address *">
                        <input
                            name="businessAddress"
                            value={form.businessAddress}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2"
                        />
                    </Field>
                </div>
            </div>


            {/* 🔻 FOOTER */}
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
                    {loading ? 'Updating...' : 'Update'}
                </button>
            </div>
        </div>
    );
}
