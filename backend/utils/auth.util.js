import bycrypt from 'bcryptjs';


export const hashPassword = async (password) => {
    const salt = await bycrypt.genSalt(10);
    return bycrypt.hash(password, salt);
}
export const comparePasswords = async (password, hashedPassword) => {
    return bycrypt.compare(password, hashedPassword);
}